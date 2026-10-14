/* =====================================================================
   EquipmentPriceDB — ฐานข้อมูลติดตามราคาอุปกรณ์ตามราคาทองและค่าเงิน
   สำหรับ SQL Server 2016 SP1 ขึ้นไป (ใช้ CREATE OR ALTER / DROP IF EXISTS)

   ข้อมูลทั้งหมดเป็นข้อมูลจำลอง (mock) ช่วง 2026-01-01 ถึง 2026-10-14
   สร้างแบบ deterministic — รันกี่ครั้งก็ได้ตัวเลขเดิม

   สูตรราคาอุปกรณ์ (ต่อวัน):
     ต้นทุน(บาท) = ราคาฐาน(สกุลต่างประเทศ) × อัตราแลกเปลี่ยนวันนั้น
                   × [ (1 - GoldWeight) + GoldWeight × (ราคาทองวันนั้น / ราคาทองวันฐาน) ]
     ราคาขาย     = ต้นทุน × (1 + Margin%)
     GoldWeight  = สัดส่วนต้นทุนที่ผูกกับราคาทอง (0 = ไม่เกี่ยว, 1 = ผูกเต็มที่)
   ===================================================================== */

USE master;
GO
IF DB_ID(N'EquipmentPriceDB') IS NULL
    CREATE DATABASE EquipmentPriceDB COLLATE Thai_CI_AS;
GO
USE EquipmentPriceDB;
GO

/* ---------- ล้างของเดิม (รันซ้ำได้) ---------- */
DROP VIEW IF EXISTS dbo.vw_PriceCorrelation;
DROP VIEW IF EXISTS dbo.vw_MonthlyPrice;
DROP VIEW IF EXISTS dbo.vw_PriceSummaryLatest;
DROP VIEW IF EXISTS dbo.vw_MarketDaily;
DROP PROCEDURE IF EXISTS dbo.usp_ComparePrices;
DROP PROCEDURE IF EXISTS dbo.usp_RecalculatePrices;
DROP TABLE IF EXISTS dbo.EquipmentPriceHistory;
DROP TABLE IF EXISTS dbo.Equipment;
DROP TABLE IF EXISTS dbo.Suppliers;
DROP TABLE IF EXISTS dbo.Categories;
DROP TABLE IF EXISTS dbo.GoldPrices;
DROP TABLE IF EXISTS dbo.ExchangeRates;
DROP TABLE IF EXISTS dbo.Currencies;
DROP FUNCTION IF EXISTS dbo.fn_Noise;
GO

/* =====================================================================
   1) ตาราง
   ===================================================================== */

-- สกุลเงิน
CREATE TABLE dbo.Currencies (
    CurrencyCode  CHAR(3)       NOT NULL PRIMARY KEY,
    CurrencyName  NVARCHAR(50)  NOT NULL,
    Symbol        NVARCHAR(5)   NULL
);

-- อัตราแลกเปลี่ยนรายวัน (บาทต่อ 1 หน่วยสกุลเงิน)
CREATE TABLE dbo.ExchangeRates (
    RateDate      DATE          NOT NULL,
    CurrencyCode  CHAR(3)       NOT NULL REFERENCES dbo.Currencies(CurrencyCode),
    RateToTHB     DECIMAL(18,6) NOT NULL CHECK (RateToTHB > 0),
    CONSTRAINT PK_ExchangeRates PRIMARY KEY (RateDate, CurrencyCode)
);

-- ราคาทองรายวัน (ทองคำแท่ง 96.5% ต่อ 1 บาททองคำ = 15.244 กรัม)
CREATE TABLE dbo.GoldPrices (
    PriceDate         DATE          NOT NULL PRIMARY KEY,
    GoldSpotUSDPerOz  DECIMAL(18,2) NOT NULL,   -- ราคาทองตลาดโลก USD/ออนซ์
    UsdThbRate        DECIMAL(18,6) NOT NULL,   -- ค่าเงิน USD ที่ใช้คำนวณ
    GoldBarBuyTHB     DECIMAL(18,2) NOT NULL,   -- รับซื้อ
    GoldBarSellTHB    DECIMAL(18,2) NOT NULL    -- ขายออก
);

-- หมวดหมู่อุปกรณ์
CREATE TABLE dbo.Categories (
    CategoryID    INT           NOT NULL PRIMARY KEY,
    CategoryName  NVARCHAR(100) NOT NULL,
    Description   NVARCHAR(255) NULL
);

-- ผู้จำหน่าย
CREATE TABLE dbo.Suppliers (
    SupplierID    INT           NOT NULL PRIMARY KEY,
    SupplierName  NVARCHAR(150) NOT NULL,
    Country       NVARCHAR(50)  NOT NULL,
    CurrencyCode  CHAR(3)       NOT NULL REFERENCES dbo.Currencies(CurrencyCode)
);

-- อุปกรณ์
CREATE TABLE dbo.Equipment (
    EquipmentID    INT IDENTITY(1,1) PRIMARY KEY,
    EquipmentCode  VARCHAR(20)   NOT NULL UNIQUE,
    EquipmentName  NVARCHAR(150) NOT NULL,
    CategoryID     INT           NOT NULL REFERENCES dbo.Categories(CategoryID),
    SupplierID     INT           NOT NULL REFERENCES dbo.Suppliers(SupplierID),
    BaseCurrency   CHAR(3)       NOT NULL REFERENCES dbo.Currencies(CurrencyCode),
    BasePrice      DECIMAL(18,2) NOT NULL CHECK (BasePrice > 0),  -- ราคาฐานในสกุลเงินผู้ขาย
    BaseDate       DATE          NOT NULL,                          -- วันที่อ้างอิงราคาฐาน
    GoldWeight     DECIMAL(5,4)  NOT NULL CHECK (GoldWeight BETWEEN 0 AND 1),
    MarginPct      DECIMAL(5,2)  NOT NULL DEFAULT 10,
    Unit           NVARCHAR(30)  NOT NULL DEFAULT N'ชิ้น',
    IsActive       BIT           NOT NULL DEFAULT 1
);

-- ประวัติราคาอุปกรณ์รายวัน (snapshot ค่าทอง/ค่าเงิน ณ วันนั้นไว้ด้วย)
CREATE TABLE dbo.EquipmentPriceHistory (
    EquipmentID   INT           NOT NULL REFERENCES dbo.Equipment(EquipmentID),
    PriceDate     DATE          NOT NULL,
    FxRate        DECIMAL(18,6) NOT NULL,   -- อัตราแลกเปลี่ยนสกุลของอุปกรณ์
    GoldSellTHB   DECIMAL(18,2) NOT NULL,   -- ราคาทองขายออกวันนั้น
    FxIndex       DECIMAL(10,6) NOT NULL,   -- ค่าเงินวันนั้น / วันฐาน
    GoldIndex     DECIMAL(10,6) NOT NULL,   -- ราคาทองวันนั้น / วันฐาน
    CostTHB       DECIMAL(18,2) NOT NULL,
    SellPriceTHB  DECIMAL(18,2) NOT NULL,
    CONSTRAINT PK_EquipmentPriceHistory PRIMARY KEY (EquipmentID, PriceDate)
);
CREATE INDEX IX_EPH_PriceDate ON dbo.EquipmentPriceHistory(PriceDate) INCLUDE (SellPriceTHB);
GO

/* ฟังก์ชันสุ่มแบบกำหนดผลได้ คืนค่า -1 ถึง 1 จาก seed (ใช้สร้างข้อมูลจำลอง) */
CREATE OR ALTER FUNCTION dbo.fn_Noise (@Seed NVARCHAR(100))
RETURNS FLOAT
WITH SCHEMABINDING
AS
BEGIN
    -- แปลงเป็น BIGINT ก่อน ABS เพื่อไม่ให้ overflow เมื่อค่า INT เป็น -2147483648 (ผลลัพธ์อื่นเหมือนเดิมทุกค่า)
    RETURN (ABS(CAST(CAST(CAST(HASHBYTES('MD5', @Seed) AS BINARY(4)) AS INT) AS BIGINT)) % 20001) / 10000.0 - 1.0;
END;
GO

/* =====================================================================
   2) ข้อมูลหลัก
   ===================================================================== */
INSERT INTO dbo.Currencies (CurrencyCode, CurrencyName, Symbol) VALUES
 ('THB', N'บาทไทย',            N'฿'),
 ('USD', N'ดอลลาร์สหรัฐ',       N'$'),
 ('EUR', N'ยูโร',              N'€'),
 ('JPY', N'เยนญี่ปุ่น',          N'¥'),
 ('CNY', N'หยวนจีน',           N'¥');

INSERT INTO dbo.Categories (CategoryID, CategoryName, Description) VALUES
 (1, N'อุปกรณ์ไอทีและเครือข่าย',      N'เซิร์ฟเวอร์ ชิ้นส่วนคอมพิวเตอร์ อุปกรณ์เครือข่าย'),
 (2, N'ชิ้นส่วนอิเล็กทรอนิกส์',        N'ชิ้นส่วนที่มีการชุบทองหรือใช้ทองเป็นส่วนประกอบ'),
 (3, N'อุปกรณ์การแพทย์',             N'เครื่องมือและวัสดุทางการแพทย์'),
 (4, N'เครื่องมือวัดและห้องแล็บ',      N'เครื่องมือวัดและอุปกรณ์วิทยาศาสตร์'),
 (5, N'วัสดุและเครื่องมืองานทอง',      N'วัตถุดิบทองคำและเครื่องมือทำจิวเวลรี่');

INSERT INTO dbo.Suppliers (SupplierID, SupplierName, Country, CurrencyCode) VALUES
 (1, N'Pacific Tech Distribution',     N'สหรัฐอเมริกา', 'USD'),
 (2, N'Rhein Medizintechnik GmbH',     N'เยอรมนี',     'EUR'),
 (3, N'Sakura Instruments Co.',        N'ญี่ปุ่น',       'JPY'),
 (4, N'Shenzhen Goldtech Equipment',   N'จีน',         'CNY'),
 (5, N'สยามโกลด์ซัพพลาย (จำลอง)',      N'ไทย',         'THB');

INSERT INTO dbo.Equipment
 (EquipmentCode, EquipmentName, CategoryID, SupplierID, BaseCurrency, BasePrice, BaseDate, GoldWeight, MarginPct, Unit) VALUES
 ('EQ-001', N'ซีพียูเซิร์ฟเวอร์ 32 คอร์',              1, 1, 'USD',   1850.00, '2026-01-01', 0.0800, 12, N'ชิ้น'),
 ('EQ-002', N'แรมเซิร์ฟเวอร์ DDR5 64GB',              1, 1, 'USD',    320.00, '2026-01-01', 0.0500, 12, N'แถว'),
 ('EQ-003', N'สวิตช์เครือข่าย 48 พอร์ต',               1, 1, 'USD',   2400.00, '2026-01-01', 0.0300, 10, N'เครื่อง'),
 ('EQ-004', N'หัวต่อชุบทองความถี่สูง (ชุด 100)',        2, 1, 'USD',    180.00, '2026-01-01', 0.4500, 15, N'ชุด'),
 ('EQ-005', N'เครื่องวัดคลื่นไฟฟ้าหัวใจ ECG',           3, 2, 'EUR',   6200.00, '2026-01-01', 0.0400, 18, N'เครื่อง'),
 ('EQ-006', N'อิเล็กโทรดชุบทองทางการแพทย์ (กล่อง 50)', 3, 2, 'EUR',     95.00, '2026-01-01', 0.5500, 20, N'กล่อง'),
 ('EQ-007', N'กล้องจุลทรรศน์ดิจิทัล',                 4, 3, 'JPY', 480000.00, '2026-01-01', 0.0200, 15, N'เครื่อง'),
 ('EQ-008', N'มัลติมิเตอร์ดิจิทัลความแม่นยำสูง',        4, 3, 'JPY',  38000.00, '2026-01-01', 0.0300, 15, N'เครื่อง'),
 ('EQ-009', N'เครื่องเชื่อมเลเซอร์งานจิวเวลรี่',          5, 4, 'CNY',  42000.00, '2026-01-01', 0.1000, 12, N'เครื่อง'),
 ('EQ-010', N'ลวดทองคำบริสุทธิ์ 99.99% (1 กรัม)',       5, 5, 'THB',   4500.00, '2026-01-01', 0.9500,  8, N'กรัม'),
 ('EQ-011', N'ทองคำเปลว (แพ็ก 100 แผ่น)',             5, 5, 'THB',   1200.00, '2026-01-01', 0.8500, 10, N'แพ็ก'),
 ('EQ-012', N'เตาหลอมทองไฟฟ้า 2 กก.',                 5, 4, 'CNY',   9800.00, '2026-01-01', 0.0600, 12, N'เครื่อง');
GO

/* =====================================================================
   3) ข้อมูลจำลองรายวัน: ค่าเงิน + ราคาทอง
   ===================================================================== */
DROP TABLE IF EXISTS #Days;

DECLARE @StartDate DATE = '2026-01-01',
        @EndDate   DATE = '2026-10-14';

SELECT TOP (DATEDIFF(DAY, @StartDate, @EndDate) + 1)
       CAST(ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 AS INT) AS n
INTO #Days
FROM sys.all_objects a CROSS JOIN sys.all_objects b;

ALTER TABLE #Days ADD d DATE NULL;
UPDATE #Days SET d = DATEADD(DAY, n, @StartDate);

-- ค่าเงิน = ค่าฐาน + แนวโน้ม + คลื่นขึ้นลง + สัญญาณรบกวน
INSERT INTO dbo.ExchangeRates (RateDate, CurrencyCode, RateToTHB)
SELECT d.d, c.Code,
       CAST(c.Base + c.Trend * d.n
            + c.Amp * SIN(d.n / c.Period + c.Phase)
            + c.Noise * dbo.fn_Noise(CONCAT(c.Code, '-', d.n)) AS DECIMAL(18,6))
FROM #Days d
CROSS JOIN (VALUES
   -- Code   Base     Trend      Amp     Period  Phase  Noise
   ('THB',  1.0,     0.0,       0.0,    1.0,    0.0,   0.0),
   ('USD', 33.20,    0.004,     0.60,  23.0,    0.0,   0.15),
   ('EUR', 36.00,    0.003,     0.70,  29.0,    1.0,   0.18),
   ('JPY',  0.2200,  0.00002,   0.006, 31.0,    2.0,   0.002),
   ('CNY',  4.60,    0.0006,    0.08,  27.0,    0.5,   0.02)
) c(Code, Base, Trend, Amp, Period, Phase, Noise);

-- ราคาทองไทย คำนวณจากราคาตลาดโลก × ค่าเงิน USD (ปัดทีละ 50 บาท, ส่วนต่างซื้อขาย 100 บาท)
INSERT INTO dbo.GoldPrices (PriceDate, GoldSpotUSDPerOz, UsdThbRate, GoldBarBuyTHB, GoldBarSellTHB)
SELECT d.d, s.Spot, fx.RateToTHB, t.Sell - 100, t.Sell
FROM #Days d
JOIN dbo.ExchangeRates fx
  ON fx.RateDate = d.d AND fx.CurrencyCode = 'USD'
CROSS APPLY (SELECT CAST(4300 + 1.6 * d.n + 120 * SIN(d.n / 19.0)
                         + 40 * dbo.fn_Noise(CONCAT('GOLD-', d.n)) AS DECIMAL(18,2)) AS Spot) s
CROSS APPLY (SELECT CAST(ROUND(CAST(s.Spot AS FLOAT) * CAST(fx.RateToTHB AS FLOAT)
                               * 15.244 * 0.965 / 31.1035 / 50.0, 0) * 50 AS DECIMAL(18,2)) AS Sell) t;

DROP TABLE #Days;
GO

/* =====================================================================
   4) Stored Procedures
   ===================================================================== */

-- คำนวณราคาอุปกรณ์ใหม่ตามราคาทอง/ค่าเงิน (ใช้ซ้ำได้เมื่ออัปเดตข้อมูลจริง)
CREATE OR ALTER PROCEDURE dbo.usp_RecalculatePrices
    @FromDate DATE = NULL,
    @ToDate   DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;  -- ถ้าเกิด error ระหว่างทาง ให้ rollback ทั้งหมด ไม่ปล่อย transaction ค้าง

    SELECT @FromDate = ISNULL(@FromDate, MIN(PriceDate)),
           @ToDate   = ISNULL(@ToDate,   MAX(PriceDate))
    FROM dbo.GoldPrices;

    BEGIN TRAN;

    DELETE FROM dbo.EquipmentPriceHistory
    WHERE PriceDate BETWEEN @FromDate AND @ToDate;

    INSERT INTO dbo.EquipmentPriceHistory
        (EquipmentID, PriceDate, FxRate, GoldSellTHB, FxIndex, GoldIndex, CostTHB, SellPriceTHB)
    SELECT e.EquipmentID,
           g.PriceDate,
           fx.RateToTHB,
           g.GoldBarSellTHB,
           CAST(fx.RateToTHB / fxb.RateToTHB AS DECIMAL(10,6)),
           CAST(g.GoldBarSellTHB / gb.GoldBarSellTHB AS DECIMAL(10,6)),
           CAST(c.Cost AS DECIMAL(18,2)),
           CAST(ROUND(c.Cost * (1 + e.MarginPct / 100.0), 2) AS DECIMAL(18,2))
    FROM dbo.Equipment e
    JOIN dbo.GoldPrices g
      ON g.PriceDate BETWEEN @FromDate AND @ToDate
    JOIN dbo.ExchangeRates fx
      ON fx.RateDate = g.PriceDate AND fx.CurrencyCode = e.BaseCurrency
    JOIN dbo.GoldPrices gb
      ON gb.PriceDate = e.BaseDate
    JOIN dbo.ExchangeRates fxb
      ON fxb.RateDate = e.BaseDate AND fxb.CurrencyCode = e.BaseCurrency
    CROSS APPLY (SELECT CAST(e.BasePrice AS FLOAT) * CAST(fx.RateToTHB AS FLOAT)
                        * ((1 - CAST(e.GoldWeight AS FLOAT))
                           + CAST(e.GoldWeight AS FLOAT)
                             * CAST(g.GoldBarSellTHB AS FLOAT) / CAST(gb.GoldBarSellTHB AS FLOAT)) AS Cost) c
    WHERE e.IsActive = 1;

    COMMIT;
END;
GO

-- เปรียบเทียบราคาอุปกรณ์ระหว่าง 2 วัน พร้อมบอกว่าทอง/ค่าเงินเปลี่ยนเท่าไร
CREATE OR ALTER PROCEDURE dbo.usp_ComparePrices
    @Date1         DATE,
    @Date2         DATE,
    @EquipmentCode VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT e.EquipmentCode,
           e.EquipmentName,
           e.BaseCurrency,
           e.GoldWeight,
           h1.SellPriceTHB AS PriceDate1,
           h2.SellPriceTHB AS PriceDate2,
           h2.SellPriceTHB - h1.SellPriceTHB AS DiffTHB,
           CAST((h2.SellPriceTHB - h1.SellPriceTHB) * 100.0 / h1.SellPriceTHB AS DECIMAL(8,2)) AS PricePctChange,
           CASE WHEN h2.SellPriceTHB > h1.SellPriceTHB THEN N'ขึ้น'
                WHEN h2.SellPriceTHB < h1.SellPriceTHB THEN N'ลง'
                ELSE N'คงที่' END AS Direction,
           CAST((h2.GoldSellTHB - h1.GoldSellTHB) * 100.0 / h1.GoldSellTHB AS DECIMAL(8,2)) AS GoldPctChange,
           CAST((h2.FxRate - h1.FxRate) * 100.0 / h1.FxRate AS DECIMAL(8,2)) AS FxPctChange
    FROM dbo.Equipment e
    JOIN dbo.EquipmentPriceHistory h1 ON h1.EquipmentID = e.EquipmentID AND h1.PriceDate = @Date1
    JOIN dbo.EquipmentPriceHistory h2 ON h2.EquipmentID = e.EquipmentID AND h2.PriceDate = @Date2
    WHERE @EquipmentCode IS NULL OR e.EquipmentCode = @EquipmentCode
    ORDER BY PricePctChange DESC;
END;
GO

/* =====================================================================
   5) Views
   ===================================================================== */

-- ภาพรวมตลาดรายวัน: ทอง + ค่าเงินทุกสกุล + การเปลี่ยนแปลงจากวันก่อน
CREATE OR ALTER VIEW dbo.vw_MarketDaily
AS
SELECT g.PriceDate,
       g.GoldSpotUSDPerOz,
       g.GoldBarBuyTHB,
       g.GoldBarSellTHB,
       g.GoldBarSellTHB - LAG(g.GoldBarSellTHB) OVER (ORDER BY g.PriceDate) AS GoldChangeTHB,
       CASE WHEN g.GoldBarSellTHB > LAG(g.GoldBarSellTHB) OVER (ORDER BY g.PriceDate) THEN N'ขึ้น'
            WHEN g.GoldBarSellTHB < LAG(g.GoldBarSellTHB) OVER (ORDER BY g.PriceDate) THEN N'ลง'
            ELSE N'คงที่' END AS GoldTrend,
       fx.USD, fx.EUR, fx.JPY, fx.CNY
FROM dbo.GoldPrices g
CROSS APPLY (
    SELECT MAX(CASE WHEN r.CurrencyCode = 'USD' THEN r.RateToTHB END) AS USD,
           MAX(CASE WHEN r.CurrencyCode = 'EUR' THEN r.RateToTHB END) AS EUR,
           MAX(CASE WHEN r.CurrencyCode = 'JPY' THEN r.RateToTHB END) AS JPY,
           MAX(CASE WHEN r.CurrencyCode = 'CNY' THEN r.RateToTHB END) AS CNY
    FROM dbo.ExchangeRates r
    WHERE r.RateDate = g.PriceDate
) fx;
GO

-- สรุปราคาล่าสุดเทียบวันฐาน + ต่ำสุด/สูงสุดในช่วง
CREATE OR ALTER VIEW dbo.vw_PriceSummaryLatest
AS
WITH L AS (SELECT MAX(PriceDate) AS LatestDate FROM dbo.EquipmentPriceHistory),
     R AS (SELECT EquipmentID, MIN(SellPriceTHB) AS MinPrice, MAX(SellPriceTHB) AS MaxPrice
           FROM dbo.EquipmentPriceHistory GROUP BY EquipmentID)
SELECT e.EquipmentCode,
       e.EquipmentName,
       c.CategoryName,
       s.SupplierName,
       e.BaseCurrency,
       e.GoldWeight,
       e.BaseDate,
       b.SellPriceTHB AS BasePriceTHB,
       L.LatestDate,
       h.SellPriceTHB AS LatestPriceTHB,
       h.SellPriceTHB - b.SellPriceTHB AS DiffTHB,
       CAST((h.SellPriceTHB - b.SellPriceTHB) * 100.0 / b.SellPriceTHB AS DECIMAL(8,2)) AS PctChange,
       CASE WHEN h.SellPriceTHB > b.SellPriceTHB THEN N'ขึ้น'
            WHEN h.SellPriceTHB < b.SellPriceTHB THEN N'ลง'
            ELSE N'คงที่' END AS Direction,
       R.MinPrice,
       R.MaxPrice
FROM dbo.Equipment e
JOIN dbo.Categories c ON c.CategoryID = e.CategoryID
JOIN dbo.Suppliers  s ON s.SupplierID = e.SupplierID
CROSS JOIN L
JOIN dbo.EquipmentPriceHistory b ON b.EquipmentID = e.EquipmentID AND b.PriceDate = e.BaseDate
JOIN dbo.EquipmentPriceHistory h ON h.EquipmentID = e.EquipmentID AND h.PriceDate = L.LatestDate
JOIN R ON R.EquipmentID = e.EquipmentID;
GO

-- ค่าเฉลี่ยรายเดือนของราคาอุปกรณ์ ทอง และค่าเงิน
CREATE OR ALTER VIEW dbo.vw_MonthlyPrice
AS
SELECT e.EquipmentCode,
       e.EquipmentName,
       DATEFROMPARTS(YEAR(h.PriceDate), MONTH(h.PriceDate), 1) AS MonthStart,
       CAST(AVG(h.SellPriceTHB) AS DECIMAL(18,2)) AS AvgSellTHB,
       MIN(h.SellPriceTHB)                        AS MinSellTHB,
       MAX(h.SellPriceTHB)                        AS MaxSellTHB,
       CAST(AVG(h.GoldSellTHB) AS DECIMAL(18,2))  AS AvgGoldSellTHB,
       CAST(AVG(h.FxRate) AS DECIMAL(18,6))       AS AvgFxRate
FROM dbo.EquipmentPriceHistory h
JOIN dbo.Equipment e ON e.EquipmentID = h.EquipmentID
GROUP BY e.EquipmentCode, e.EquipmentName,
         DATEFROMPARTS(YEAR(h.PriceDate), MONTH(h.PriceDate), 1);
GO

-- ค่าสหสัมพันธ์ (Pearson) ระหว่างราคาอุปกรณ์กับราคาทอง และกับค่าเงิน
-- ใกล้ 1 = ขึ้นลงตามกัน, ใกล้ 0 = ไม่สัมพันธ์, ติดลบ = สวนทาง
CREATE OR ALTER VIEW dbo.vw_PriceCorrelation
AS
WITH S AS (
    SELECT h.EquipmentID,
           CAST(COUNT(*) AS FLOAT) AS n,
           SUM(CAST(h.SellPriceTHB AS FLOAT))                                   AS sx,
           SUM(CAST(h.SellPriceTHB AS FLOAT) * CAST(h.SellPriceTHB AS FLOAT))   AS sxx,
           SUM(CAST(h.GoldSellTHB AS FLOAT))                                    AS sg,
           SUM(CAST(h.GoldSellTHB AS FLOAT) * CAST(h.GoldSellTHB AS FLOAT))     AS sgg,
           SUM(CAST(h.SellPriceTHB AS FLOAT) * CAST(h.GoldSellTHB AS FLOAT))    AS sxg,
           SUM(CAST(h.FxRate AS FLOAT))                                         AS sf,
           SUM(CAST(h.FxRate AS FLOAT) * CAST(h.FxRate AS FLOAT))               AS sff,
           SUM(CAST(h.SellPriceTHB AS FLOAT) * CAST(h.FxRate AS FLOAT))         AS sxf
    FROM dbo.EquipmentPriceHistory h
    GROUP BY h.EquipmentID
),
V AS (
    SELECT EquipmentID,
           n * sxg - sx * sg AS CovG,
           n * sxf - sx * sf AS CovF,
           n * sxx - sx * sx AS VarX,
           n * sgg - sg * sg AS VarG,
           n * sff - sf * sf AS VarF
    FROM S
)
SELECT e.EquipmentCode,
       e.EquipmentName,
       e.BaseCurrency,
       e.GoldWeight,
       CAST(CASE WHEN V.VarX > 0 AND V.VarG > 0
                 THEN V.CovG / SQRT(V.VarX * V.VarG) END AS DECIMAL(6,4)) AS CorrWithGold,
       CAST(CASE WHEN e.BaseCurrency <> 'THB' AND V.VarX > 0 AND V.VarF > 1e-9
                 THEN V.CovF / SQRT(V.VarX * V.VarF) END AS DECIMAL(6,4)) AS CorrWithFx
FROM V
JOIN dbo.Equipment e ON e.EquipmentID = V.EquipmentID;
GO

/* =====================================================================
   6) คำนวณราคาอุปกรณ์จากข้อมูลจำลอง
   ===================================================================== */
EXEC dbo.usp_RecalculatePrices;
GO

-- ตรวจจำนวนแถว
SELECT 'Currencies' AS TableName, COUNT(*) AS Rows FROM dbo.Currencies
UNION ALL SELECT 'ExchangeRates', COUNT(*) FROM dbo.ExchangeRates
UNION ALL SELECT 'GoldPrices', COUNT(*) FROM dbo.GoldPrices
UNION ALL SELECT 'Equipment', COUNT(*) FROM dbo.Equipment
UNION ALL SELECT 'EquipmentPriceHistory', COUNT(*) FROM dbo.EquipmentPriceHistory;
GO

/* =====================================================================
   7) ตัวอย่างคำสั่งใช้งาน
   =====================================================================
-- ราคาล่าสุดเทียบต้นปี
SELECT * FROM dbo.vw_PriceSummaryLatest ORDER BY PctChange DESC;

-- เทียบราคา 2 วัน (ทุกอุปกรณ์ หรือระบุรหัส)
EXEC dbo.usp_ComparePrices @Date1 = '2026-03-01', @Date2 = '2026-10-14';
EXEC dbo.usp_ComparePrices '2026-06-01', '2026-10-14', 'EQ-010';

-- ภาพรวมทองและค่าเงินรายวัน
SELECT * FROM dbo.vw_MarketDaily ORDER BY PriceDate DESC;

-- อุปกรณ์ไหนผูกกับทอง/ค่าเงินมากที่สุด
SELECT * FROM dbo.vw_PriceCorrelation ORDER BY CorrWithGold DESC;

-- แนวโน้มรายเดือนของอุปกรณ์ชิ้นหนึ่ง
SELECT * FROM dbo.vw_MonthlyPrice WHERE EquipmentCode = 'EQ-004' ORDER BY MonthStart;

-- เพิ่มข้อมูลวันใหม่ (ข้อมูลจริง) แล้วคำนวณเฉพาะวันนั้น
-- INSERT INTO dbo.ExchangeRates VALUES ('2026-10-15','THB',1),('2026-10-15','USD',33.95), ...;
-- INSERT INTO dbo.GoldPrices VALUES ('2026-10-15', 4750.00, 33.95, 69800, 69900);
-- EXEC dbo.usp_RecalculatePrices '2026-10-15', '2026-10-15';
*/
