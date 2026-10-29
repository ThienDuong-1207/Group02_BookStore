# Bùi Gia Phát – Công việc Sprint 1 (23/10 – 29/10/2026)

> Tổng hợp ngày 29/10/2026 từ 3 nguồn: **GitHub** (`ThienDuong-1207/Group02_BookStore`: commit, PR, review), **Jira** (project GB: issue, lịch sử trạng thái, worklog) và **kiểm tra trực tiếp** các URL trên Vercel.
> Các tài liệu không nằm trên GitHub/Jira (PMP, Excel, Zalo) thì không kiểm tra được ở đây, nên được ghi là "chưa xác minh".

## 1. Việc được giao trong Sprint 1 (Master Plan v0.2)

| WBS | Việc | Ghi chú |
|---|---|---|
| 1.3.9 | **US-24 – Deploy lên hosting miễn phí (staging)** · Jira GB-41 (2 SP) | Story code duy nhất của Phát trong Sprint 1 |
| 1.2.7 | PMP phần 5 (Quản lý rủi ro, ≥ 8 rủi ro) và phần 7 (Kế hoạch giao tiếp) | Tài liệu PMP |
| 1.4.3 | Code review các PR F1 (của Thiện, Đan) | Theo Master Plan |
| 1.1.1–1.1.3 | Kick-off, Sprint Planning 1, Daily Scrum | Việc chung cả nhóm |

Từ bản v0.2 (28/10), US-13 đã chuyển sang Thiện và US-14 sang Đan, nên hai story này không còn là việc của Phát.

## 2. Đã triển khai (có bằng chứng)

**US-24 – Deploy (GB-41)**

- ✅ **Có project Vercel `group02-book-store` kết nối với GitHub.** Vercel bot comment link preview trên các PR #5, #6, #7, #9, #11, #12, nên **AC M2** ("mỗi PR có preview") đạt.
- ✅ **Production `https://group02-book-store.vercel.app` mở được mà không cần đăng nhập Vercel.** Kiểm tra ngày 29/10: trang `/books` hiện bình thường. **AC B1** đạt trên máy tính; chưa thử bằng điện thoại dùng 4G.
- ✅ **Production được cập nhật từ nhánh `main`.** Ví dụ release PR #13 (`develop → main`) đã lên production. **AC M1** đạt cho phần production.
- ℹ️ Project Vercel nằm dưới tài khoản của Thiện (`thienduong-1207s-projects`), nên từ bên ngoài không xác định được ai đã cấu hình.

**Jira**

- GB-41 (US-24) và 3 subtask GB-63, GB-64, GB-65 ở trạng thái **Done**. Theo lịch sử Jira, cả 4 issue do **Dương Chí Thiện** chuyển sang Done lúc 07:08–07:09 ngày 29/10.

## 3. Chưa thấy bằng chứng / còn tồn đọng

| # | Vấn đề | Chi tiết |
|---|---|---|
| 1 | **Staging (nhánh `develop`) đang lỗi** | `https://group02-book-store-git-develop-thienduong-1207s-projects.vercel.app` trả về **500 `MIDDLEWARE_INVOCATION_FAILED`** trên `/books` và `/login` (kiểm tra 29/10). Nhiều khả năng do chưa có biến môi trường Supabase cho môi trường *Preview* (GB-63). Vì vậy **AC M1** (merge vào `develop` thì staging cập nhật và dùng được) chưa đạt. Nhóm cũng không test được trên staging. |
| 2 | **Link preview của PR bắt đăng nhập Vercel** | Vercel Deployment Protection đang bật, nên reviewer không mở được preview để kiểm tra AC (CONTRIBUTING.md §5). |
| 3 | **README chưa cập nhật** (GB-65 đã Done) | Trên `develop`, README vẫn ghi Production/Staging là "_to be added_" và mật khẩu demo là "_see Final Report_". |
| 4 | **Chưa có test case cho US-24** (GB-65) | `docs/test-cases/` chưa có test case nào cho US-24 (M1, M2, M3, B1). |
| 5 | **Không có hoạt động nào trên GitHub** | Tài khoản `@Phat-2005` có **0 commit, 0 PR, 0 review, 0 comment** trong Sprint 1. GitHub đã tự mời Phát review PR #6, #9, #11, #12 nhưng chưa có review nào (WBS 1.4.3). CONTRIBUTING.md §9 quy định: *mỗi thành viên phải có commit và PR trong mọi Sprint; không có commit trong cả 3 Sprint thì điểm A = 0.* |
| 6 | **Chưa log giờ trên Jira** | GB-41 và GB-63 đến 65 không có worklog nào, trong khi brief yêu cầu "actual hours logged". |
| 7 | **PMP phần 5 và 7: chưa xác minh** | Không có trên repo hay trong tài liệu project. Cần Phát gửi file. |

**Lưu ý để tránh hiểu nhầm:** commit `bc62ef4` có message "phat" và file `docs/guides/sprint1-phat.md` là do **Thiện** viết (hướng dẫn Sprint 1 cho Phát), không phải sản phẩm của Phát.

## 4. Đề xuất trước hạn nộp Sprint 1 (23:59 29/10)

1. **Sửa staging:** trong Vercel → Settings → Environment Variables, thêm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` và `SUPABASE_SERVICE_ROLE_KEY` cho môi trường **Preview** (key của `bookstore-staging`), rồi redeploy `develop`.
2. **Phát mở 1 PR nhỏ** (ví dụ `docs/GB-41-deploy-info`) gồm: URL production/staging trong README và test case US-24 trong `docs/test-cases/F1.md`. Vừa hoàn thành GB-65, vừa có commit và PR cho Sprint 1.
3. **Log giờ thực tế** cho GB-41 và GB-63 đến 65 trên Jira.
4. **Review ít nhất 1 PR** đang mở, hoặc review lại PR đã merge (WBS 1.4.3).
5. **Gửi PMP phần 5 và 7** cho Thiện để ghép vào `c1_ProjectPlan.docx`.
