# Super-admin frontend tuzatishlari — 2026-10-23

Kod o‘zgartirildi. Test, build, lint, deploy va brauzer sinovi foydalanuvchiga qoldirildi; ishga tushirilmagan.

- Login telefon/paroli oldindan to‘ldirilishi olib tashlandi; localStorage user JSON'i xavfsiz o‘qiladi va SUPER_ADMIN roli tekshiriladi. Haqiqiy ruxsat backendda tekshiriladi.
- Global window.fetch override va ikkita alohida refresh navbati olib tashlandi. Barcha panel so‘rovlari bitta API client orqali o‘tadi.
- Token faqat sozlangan API origin'idagi admin endpointlariga yuboriladi. Boshqa origin/path rad etiladi; redirect kuzatilmaydi, cookie yuborilmaydi va javob keshlanmaydi.
- Parallel 401 uchun bitta refresh; qayta urinish bir marta. Logout/yangi login vaqtida tugayotgan eski refresh mahalliy sessiyani qayta tiklamaydi. Tarmoq/503 xatosi avtomatik logout qilmaydi.
- Logout serverdagi barcha sessiyalarni bekor qiladi, keyin lokal tokenlarni tozalaydi. Tarmoq xatosida bajarilmagani ko‘rsatiladi. Parol almashtirish formasi qo‘shildi; muvaffaqiyatdan keyin qayta login kerak.
- Maktablar ro‘yxatida loading/error ajratildi; muvaffaqiyatsiz so‘rov bo‘sh ro‘yxat deb ko‘rsatilmaydi. Sahifa almashganda eskirgan GET javoblari bekor qilinadi.
- Login, maktab va admin yaratish formalarida takroriy submit cheklovi. Clipboard yozish muvaffaqiyatsiz bo‘lsa xato ko‘rsatiladi.
- Admin yaratish xatolari modalning ichida ko‘rsatiladi; jo‘natish davomida modal yopilmaydi. Parol 12 belgi / 72 bayt chegarasi bor; backend ham tekshiradi.
- DB connection string frontend type'laridan olib tashlandi. Tekshirilmagan DB ulanish holati o‘rniga maktab ma’lumotlari matni ishlatiladi.

Production build vaqtida NEXT_PUBLIC_API_URL to‘liq HTTPS origin qilib berilishi shart (path/query/credential bo‘lmasin). Lokal default port backendga mos 6560 bo‘ldi. Backenddagi shu nomli branch va `000005_super_admin_auth_version` migratsiyasi bilan birga qo‘llanadi. Eski super-admin sessiyalar qayta login talab qiladi.

To‘liq backend o‘zgarishlari, cheklovlar va qo‘lda tekshiruvlar: `farzandim-backend/docs/SUPERADMIN_FIX_REPORT.md` (shu branch). Ayniqsa login/refresh/logout, parol almashishi, maktab/admin yaratish, server xatosi va ikki qurilmadagi sessiyalarni tekshiring.

Token saqlash hali localStorage asosida; HttpOnly cookie/BFF va MFA yo‘q. Bu patch butun platformaning productionga tayyorligini tasdiqlamaydi. Main branch merge va deploy qilinmadi.
