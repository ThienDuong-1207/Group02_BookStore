# Hướng dẫn Sprint 1 cho Phát (US-13, US-14, US-24)

> Mục tiêu: Phát tự làm và tự đẩy code lên GitHub cho 3 story của mình, có AI hỗ trợ (môn học cho phép, nhưng phải ghi vào `docs/AI_USAGE.md` và **phải giải thích được code**).
> Làm theo đúng thứ tự: **US-13 → US-14 → US-24**. Mỗi story là 1 nhánh và 1 Pull Request (PR).
> Bị kẹt ở bước nào thì chụp màn hình gửi nhóm, đừng tự ý sửa trên `main` hoặc `develop`.

---

## Bước 0. Chuẩn bị máy (làm 1 lần)

1. Cài **Node.js 20+**: https://nodejs.org (chọn bản LTS). Kiểm tra bằng lệnh `node -v`.
2. Cài **Git**: https://git-scm.com. Kiểm tra bằng lệnh `git --version`.
3. Cài **VS Code** và **Claude Code** (hoặc dùng Cursor hay Copilot đều được).
4. Khai báo tên Git **của chính Phát**. Bước này rất quan trọng, vì thầy chấm commit theo tên này:

```bash
git config --global user.name "Phat-2005"
git config --global user.email "<email GitHub của Phát>"
```

5. Clone repo về máy và cài thư viện:

```bash
git clone https://github.com/ThienDuong-1207/Group02_BookStore.git
cd Group02_BookStore
npm install
```

6. Xin Thiện file `.env.local` (chứa key Supabase staging). Gửi qua tin nhắn riêng, **tuyệt đối không commit file này**. Đặt file vào thư mục gốc của repo.
7. Chạy thử bằng lệnh `npm run dev`, rồi mở http://localhost:3000. Thấy trang "Book Store – Release 1.0" là được.

---

## Bước 1. Quy trình chung cho MỖI story

```bash
# 1. Lấy code mới nhất của develop
git checkout develop
git pull

# 2. Tạo nhánh mới (thay <id> bằng mã Jira, ví dụ GB-15)
git checkout -b feature/GB-<id>-<ten-ngan>
```

3. Mở Claude Code trong thư mục repo và dán **prompt của story** (ở phần bên dưới).
4. Đọc kỹ những gì AI tạo ra. **Hỏi lại AI những chỗ chưa hiểu**, ví dụ: "Giải thích file middleware.ts từng dòng". Lúc Sprint Review, thầy có thể hỏi Phát.
5. Chạy kiểm tra. Cả 4 lệnh đều phải pass:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

6. Tự test bằng tay trên http://localhost:3000 theo từng AC của story.
7. Commit rồi push:

```bash
git add .
git status                      # kiểm tra KHÔNG có .env.local trong danh sách
git commit -m "feat(auth): <mô tả ngắn> (GB-<id>)"
git push -u origin feature/GB-<id>-<ten-ngan>
```

8. Vào GitHub, bấm **Compare & pull request**:
   - **base: `develop`** (không chọn `main`)
   - Tiêu đề giống commit, ví dụ `feat(auth): admin route protection (GB-<id>)`
   - Điền template: đánh dấu từng AC đã làm và dán ảnh chụp màn hình
   - Reviewers: chọn **Thiện** hoặc **Đan**
9. Trên Jira, chuyển issue sang **In Review** và log số giờ đã làm.
10. Sau khi được approve: bấm **Squash and merge**, rồi bấm **Delete branch**.

---

## Bước 2. Prompt cho từng story

### US-13: Hai vai trò và chặn trang admin (làm ĐẦU TIÊN)

```
Read PROJECT_SPEC.md and CONTRIBUTING.md.
Implement user story US-13 only (Jira GB-<id>), on the current branch.
1. Restate the AC (M1, M2, E1, E2, E3, B1) and list files you will create/change.
2. Create:
   - src/middleware.ts + src/lib/supabase/middleware.ts: refresh the session with @supabase/ssr;
     on /admin/** redirect guests to /login and send non-admins to a 403 page.
   - src/lib/auth/: getCurrentProfile() and requireAdmin() that read public.profiles ON THE SERVER
     and throw 403 if role != ADMIN or status = LOCKED.
   - src/app/admin/page.tsx: admin menu (Books, Categories, Authors, Users).
   - src/app/forbidden (403 page): "You do not have permission to access this page."
3. Add Vitest tests for requireAdmin (admin ok, customer 403, locked admin 403, guest).
4. Add test cases for every AC in docs/test-cases/F1.md.
5. Run lint, typecheck, test, build and fix all errors.
6. Append a row to docs/AI_USAGE.md (member: Bùi Gia Phát).
Do not touch other stories. Explain each file to me in simple Vietnamese at the end.
```

### US-14: Admin tạo, khoá và mở khoá tài khoản (làm sau khi US-13 đã merge)

```
Read PROJECT_SPEC.md and CONTRIBUTING.md.
Implement user story US-14 only (Jira GB-<id>). requireAdmin() from US-13 already exists.
1. Restate the AC (M1–M3, E1, E2, B1) and list files you will create/change.
2. Page /admin/users: table with name, email, role, status, created date.
3. Server actions (each starts with `await requireAdmin()`), using the server-only admin client:
   - create: auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } }),
     then set profiles.role. Duplicate email -> "This email is already registered".
   - lock: profiles.status = 'LOCKED' + auth.admin.updateUserById(id, { ban_duration: '876000h' }).
   - unlock: status 'ACTIVE' + ban_duration 'none'.
   - an admin cannot lock their own account (button disabled AND server rejects).
4. Zod schema with the same rules as US-10 B1 (password 8–64 chars, letter + digit; phone 10 digits starting with 0).
5. Vitest tests + test cases in docs/test-cases/F1.md for every AC.
6. Run lint, typecheck, test, build. Append a row to docs/AI_USAGE.md (member: Bùi Gia Phát).
Explain each file to me in simple Vietnamese at the end.
```

### US-24: Deploy lên Vercel (làm bằng tay trên web, không cần nhiều code)

1. Đăng nhập https://vercel.com **bằng GitHub của Phát**. Nhờ Thiện (admin repo) cấp quyền cho Vercel truy cập repo.
2. **Add New → Project**, chọn `Group02_BookStore`. Framework sẽ tự nhận là Next.js.
3. **Settings → Environment Variables** (lấy giá trị từ Thiện):

   | Biến | Production (`main`) | Preview (`develop` + PR) |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | bookstore-prod | bookstore-staging |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod | staging |
   | `SUPABASE_SERVICE_ROLE_KEY` | prod | staging |

4. **Settings → Git**: Production Branch = `main`.
5. Mở một PR thử để kiểm tra Vercel có comment link preview (AC M2).
6. Vào Supabase → **Authentication → URL Configuration**: thêm URL Vercel vào Site URL và Redirect URLs.
7. Mở link production **bằng điện thoại dùng 4G**, không đăng nhập (AC B1), rồi chụp màn hình.
8. Tạo nhánh `feature/GB-<id>-deploy` và cập nhật `README.md` (dòng Production và Staging URL). Thêm test case US-24 vào `docs/test-cases/F1.md`, sau đó commit, push và mở PR như Bước 1.

---

## Checklist trước khi bấm "Create pull request"

- [ ] Nhánh đúng tên `feature/GB-<id>-...`, base là `develop`
- [ ] 4 lệnh lint / typecheck / test / build đều pass
- [ ] Không có `.env.local`, mật khẩu hay key trong commit
- [ ] Mỗi AC có ít nhất 1 test case trong `docs/test-cases/F1.md`
- [ ] Đã thêm 1 dòng vào `docs/AI_USAGE.md`
- [ ] Tự giải thích được từng file đã thay đổi
