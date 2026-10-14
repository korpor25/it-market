"""สร้าง app/equipment_snapshot.json จากฐานข้อมูล EquipmentPriceDB ในเครื่อง

หน้า "ทองและค่าเงิน" อ่านจาก SQL Server ก่อน ถ้าเชื่อมไม่ได้ (เช่นบน Vercel) จะใช้ไฟล์นี้แทน
รันใหม่ทุกครั้งที่แก้ EquipmentPriceDB.sql แล้วรันสคริปต์ SQL นั้นซ้ำ:

    .venv\\Scripts\\python scripts\\export_equipment_snapshot.py

ต้องตั้งค่า EQUIPMENT_DB_CONNECTION ใน .env ก่อน (ดู .env.example)
"""

from __future__ import annotations

import json
import sys
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app.main as main  # noqa: E402


def main_export() -> None:
    try:
        overview = main.read_equipment_overview()
        details = {item["code"]: main.read_equipment_detail(item["code"]) for item in overview["equipment"]}
    except main.EquipmentDbError as error:
        sys.exit(f"อ่านฐานข้อมูลไม่ได้: {error.code} — {main.EQUIPMENT_DB_ERRORS[error.code]}")
    snapshot = {
        "exported_at": datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "overview": overview,
        "details": details,
    }
    text = json.dumps(snapshot, ensure_ascii=False, separators=(",", ":"))
    main.EQUIPMENT_SNAPSHOT_PATH.write_text(text + "\n", encoding="utf-8")
    print(f"บันทึก {main.EQUIPMENT_SNAPSHOT_PATH.name}: {len(details)} อุปกรณ์, {len(text) / 1024:.0f} KB")


if __name__ == "__main__":
    main_export()
