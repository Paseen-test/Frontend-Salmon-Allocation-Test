# Salmon Allocation

React + TypeScript + Tailwind (Vite) เพิ่ม lib `@tanstack/react-virtual` ไว้ทำ virtual list ครับ

```bash
npm install
npm run dev
```

ต้องใช้ Node 20.19 ขึ้นไป (Vite 7)

## ใช้งาน

เปิดหน้ามาจะ auto allocate ให้เลย (10,000 แถว) แก้จำนวนได้ที่ช่อง Allocated ถ้าใส่เกินสต็อก เกินเครดิตลูกค้า หรือเกินที่ขอ ระบบจะไม่รับและบอกว่าใส่ได้สูงสุดเท่าไหร่ครับ

ค้นหาด้วย order / customer และกรองตาม status ได้ครับ
