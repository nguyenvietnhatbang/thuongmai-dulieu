# Phân tích yêu cầu CRM dịch vụ tư vấn + luồng thương mại

Tài liệu này tổng hợp lại yêu cầu từ sơ đồ khách hàng cung cấp, chỉnh lại theo góc nhìn sản phẩm để có thể triển khai thực tế trên  web nội bộ sau này.

---

## 1. Yêu cầu gốc cốt lõi từ khách hàng

### 1.1. Bản chất hệ thống khách đang muốn làm

Khách đang hình dung một hệ thống quản lý nội bộ gồm **2 luồng hoạt động chính**:

1. **Luồng kinh doanh dịch vụ tư vấn / dự án**
2. **Luồng thương mại: mua hàng, nhập kho, bán hàng, tồn kho, công nợ**

Hai luồng này có thể dùng chung một số dữ liệu như:

- Người dùng nội bộ
- Danh mục trạng thái
- Danh mục loại dữ liệu
- Khách hàng
- Công nợ
- Báo cáo

Tuy nhiên khi triển khai thực tế, cần tách rõ vì bản chất vận hành của 2 luồng khác nhau. Luồng dịch vụ tư vấn đi theo quá trình **Khách hàng → Cơ hội → Báo giá → Hợp đồng → Dự án → Công việc → Đóng dự án → Công nợ → Chăm sóc lại**. Luồng thương mại đi theo quá trình **Nhà cung ứng → Mua hàng → Nhập kho → Theo dõi tồn kho → Bán hàng → Xuất file công nợ → Báo cáo**.

---

### 1.2. Luồng chính 1: Kinh doanh dịch vụ tư vấn / dự án

#### A. Quản lý khách hàng

Khách muốn lưu thông tin khách hàng, gồm:

- Mã khách hàng
- Tên khách hàng / tên công ty
- Nhân viên phụ trách
- Trạng thái khách hàng
- Danh sách người liên hệ của khách
- Số điện thoại, email, họ tên người liên hệ

Ý nghĩa nghiệp vụ:

- Một khách hàng có thể có nhiều người liên hệ.
- Một khách hàng có thể phát sinh nhiều cơ hội.
- Một khách hàng có thể phát sinh nhiều báo giá, hợp đồng, dự án, công nợ và lịch chăm sóc.

---

#### B. Quản lý cơ hội bán hàng

Khách muốn quản lý cơ hội phát sinh từ khách hàng, gồm:

- Mã cơ hội
- Khách hàng liên quan
- Tiêu đề cơ hội
- Giai đoạn cơ hội
- Nhân viên phụ trách

Ý nghĩa nghiệp vụ:

- Cơ hội là bước trước báo giá.
- Một khách hàng có thể có nhiều cơ hội.
- Một cơ hội có thể tạo ra một hoặc nhiều báo giá.

---

#### C. Quản lý báo giá

Khách muốn quản lý báo giá theo cơ hội, gồm:

- Mã báo giá
- Khách hàng
- Cơ hội
- Số báo giá
- Trạng thái báo giá
- Chi tiết báo giá
- Nội dung hạng mục
- Số lượng
- Đơn giá

Ý nghĩa nghiệp vụ:

- Báo giá được tạo từ cơ hội.
- Báo giá cần có nhiều dòng chi tiết.
- Khi báo giá được chốt, có thể tạo hợp đồng.

---

#### D. Quản lý hợp đồng

Khách muốn quản lý hợp đồng, gồm:

- Mã hợp đồng
- Khách hàng
- Báo giá liên quan
- Số hợp đồng
- Trạng thái hợp đồng
- Dự án đã tạo hay chưa

Yêu cầu đặc thù quan trọng:

- Khi **trạng thái hợp đồng = Đã ký**, hệ thống cần **tự động tạo một dự án mới**.
- Tránh tạo trùng dự án nếu hợp đồng đã từng tạo dự án trước đó.
- Dự án mới cần kế thừa thông tin từ hợp đồng, báo giá và khách hàng.

---

#### E. Quản lý dự án

Khách muốn sau khi ký hợp đồng sẽ có dự án để theo dõi thực hiện, gồm:

- Mã dự án
- Hợp đồng liên quan
- Khách hàng
- Mã dự án
- Quản lý dự án
- Trạng thái dự án

Ý nghĩa nghiệp vụ:

- Dự án là nơi theo dõi quá trình thực hiện sau bán hàng.
- Một dự án có thể có nhiều lịch chung.
- Một dự án có thể có nhiều công việc.
- Một dự án có thể có nhiều ghi chú nội bộ.
- Một dự án có thể có hồ sơ đóng dự án.
- Một dự án có thể liên quan đến công nợ.

---

#### F. Quản lý lịch, công việc, ghi chú nội bộ

Khách muốn có phần theo dõi thực hiện gồm:

**Lịch chung:**

- Dự án
- Khách hàng
- Loại lịch
- Ngày bắt đầu
- Người phụ trách

**Công việc:**

- Dự án
- Khách hàng
- Tiêu đề công việc
- Người phụ trách
- Trạng thái công việc

**Ghi chú nội bộ:**

- Dự án
- Khách hàng
- Công việc liên quan
- Người gửi
- Người nhận
- Trạng thái

Yêu cầu đặc thù quan trọng:

- Khi có ghi chú mới, người nhận cần được thông báo.
- Khi có phản hồi mới, người tạo ghi chú cần được thông báo.

---

#### G. Đóng dự án / nghiệm thu

Khách muốn có bước đóng dự án, gồm:

- Mã đóng dự án
- Dự án
- Ngày đóng
- Tình trạng nghiệm thu
- Trạng thái lưu trữ

Ý nghĩa nghiệp vụ:

- Đây là bước xác nhận dự án đã hoàn thành.
- Có thể dùng làm căn cứ theo dõi công nợ, nghiệm thu và lưu hồ sơ.

---

#### H. Công nợ và đợt thanh toán

Khách muốn theo dõi thanh toán và công nợ, gồm:

**Đợt thanh toán:**

- Hợp đồng
- Tên đợt
- Ngày đến hạn
- Số tiền phải thu
- Trạng thái

**Công nợ:**

- Hợp đồng
- Dự án
- Khách hàng
- Đợt thanh toán
- Trạng thái công nợ

Yêu cầu đặc thù quan trọng:

- Trước ngày đến hạn 3 ngày, hệ thống gửi thông báo nhắc công nợ.
- Nếu quá hạn mà chưa thanh toán, hệ thống cảnh báo quá hạn.

---

#### I. Nhắc hẹn chăm sóc khách hàng

Khách muốn có tính năng chăm sóc định kỳ, gồm:

- Khách hàng
- Hợp đồng
- Dự án
- Ngày nhắc hẹn
- Trạng thái

Yêu cầu đặc thù quan trọng:

- Hệ thống tự động nhắc theo `NgayNhacHen`.
- Sau khi chăm sóc xong, người dùng có thể tạo `NgayChamSocTiepTheo` để tiếp tục chăm sóc lần sau.

---

### 1.3. Luồng chính 2: Thương mại / mua bán / kho

#### A. Quản lý nhà cung ứng

Khách muốn lưu nhà cung ứng, gồm:

- Mã nhà cung ứng
- Tên nhà cung ứng
- Điện thoại
- Email
- Địa chỉ
- Trạng thái

---

#### B. Quản lý khách hàng thương mại

Khách muốn có nhóm khách hàng phục vụ bán hàng thương mại, docs/huongdan.md thay vì role cố định hãy dgồm:

- Mã khách hàng thương mại
- Tên khách hàng
- Điện thoại
- Email
- Địa chỉ
- Trạng thái

Cần làm rõ sau này khách hàng thương mại có dùng chung với bảng khách hàng dịch vụ hay tách riêng. Nếu cùng một khách vừa mua dịch vụ vừa mua hàng, nên dùng chung bảng khách hàng để tránh trùng dữ liệu.

---

#### C. Mua hàng và nhập kho

Khách muốn có quy trình:

- Tạo phiếu mua hàng
- Chọn nhà cung ứng
- Nhập ngày mua
- Tổng tiền
- Trạng thái
- Tạo phiếu nhập kho
- Chọn ngày nhập
- Tổng tiền
- Chọn kho nhập

Ý nghĩa nghiệp vụ:

- Mua hàng là bước ghi nhận đơn hàng mua từ nhà cung cấp.
- Nhập kho là bước ghi nhận hàng thực tế đã về kho.
- Không phải cứ mua là đã nhập đủ kho, nên cần phân biệt mua hàng và nhập kho.

---

#### D. Theo dõi tồn kho

Khách muốn theo dõi tồn kho, gồm:

- Sản phẩm
- Số lượng tồn
- Đơn vị tính
- Kho
- Ngày cập nhật

Ý nghĩa nghiệp vụ:

- Tồn kho cần được cập nhật từ nhập kho và bán hàng.
- Cần tránh cho người dùng sửa trực tiếp số tồn nếu không có quyền.
- Nên có lịch sử nhập, xuất, điều chỉnh kho để kiểm tra sai lệch.

---

#### E. Bán hàng và xuất file công nợ

Khách muốn có bán hàng, gồm:

- Mã bán hàng
- Khách hàng thương mại
- Ngày bán
- Tổng tiền
- Trạng thái

Khách cũng muốn xuất file công nợ, gồm:

- Mã xuất file
- Bán hàng liên quan
- Ngày xuất
- Trạng thái

Ý nghĩa nghiệp vụ:

- Khi phát sinh bán hàng chưa thu đủ tiền, hệ thống cần theo dõi công nợ.
- Xuất file công nợ có thể là file Excel/PDF gửi kế toán hoặc khách hàng.

---

#### F. Báo cáo thương mại

Khách muốn có các báo cáo:

- Báo cáo mua hàng
- Báo cáo bán hàng / đơn hàng
- Báo cáo tồn kho

Các báo cáo này phục vụ theo dõi tổng quan, không nhất thiết là bảng nhập liệu chính.

---

## 2. Thiết kế hoàn chỉnh các màn hình chức năng để hiện thực hóa yêu cầu

### 2.1. Nguyên tắc thiết kế sản phẩm

Không nên bê nguyên sơ đồ bảng dữ liệu thành màn hình. Người dùng không làm việc theo bảng kỹ thuật, mà làm theo nghiệp vụ hằng ngày. Vì vậy nên thiết kế theo các nhóm màn hình sau:

1. **Dashboard tổng quan**
2. **CRM / Kinh doanh**
3. **Báo giá - Hợp đồng**
4. **Dự án / Thực hiện**
5. **Công nợ**
6. **Chăm sóc khách hàng**
7. **Thương mại / Kho**
8. **Báo cáo**
9. **Danh mục - Cấu hình**
10. **Quản trị người dùng**

---

### 2.2. Màn hình Dashboard tổng quan

#### Mục đích

Giúp quản lý nhìn nhanh tình hình vận hành của cả 2 luồng.

#### Thành phần nên có

- Tổng số khách hàng
- Số cơ hội đang xử lý
- Số báo giá chờ phản hồi
- Số hợp đồng đã ký trong tháng
- Số dự án đang thực hiện
- Số công việc quá hạn
- Số công nợ sắp đến hạn
- Số công nợ quá hạn
- Số lịch chăm sóc hôm nay / tuần này
- Tổng doanh số bán hàng thương mại trong tháng
- Tổng tồn kho hoặc cảnh báo tồn thấp nếu có quản lý sản phẩm

#### Bộ lọc

- Theo thời gian
- Theo nhân viên phụ trách
- Theo khách hàng
- Theo trạng thái
- Theo luồng: dịch vụ / thương mại

---

### 2.3. Màn hình Khách hàng

#### Chức năng chính

- Xem danh sách khách hàng
- Thêm khách hàng
- Sửa thông tin khách hàng
- Xem chi tiết khách hàng
- Lưu nhiều người liên hệ cho một khách hàng
- Xem toàn bộ lịch sử liên quan đến khách hàng

#### Thông tin cần hiển thị

- Mã khách hàng
- Tên khách hàng / công ty
- Người phụ trách
- Số điện thoại chính
- Email chính
- Trạng thái
- Loại khách hàng: dịch vụ, thương mại, cả hai
- Ngày tạo
- Lần chăm sóc gần nhất
- Ngày nhắc chăm sóc tiếp theo

#### Tab trong chi tiết khách hàng

1. Thông tin chung
2. Người liên hệ
3. Cơ hội
4. Báo giá
5. Hợp đồng
6. Dự án
7. Công nợ
8. Lịch chăm sóc
9. Ghi chú nội bộ
10. File đính kèm nếu có

#### Bổ sung cần thiết

- Tránh tạo trùng khách hàng theo số điện thoại, email hoặc mã số thuế nếu có.
- Có trạng thái khách hàng: mới, đang chăm sóc, đang có dự án, tạm dừng, ngừng hợp tác.
- Có trường nhân viên phụ trách để phân quyền và lọc dữ liệu.

---

### 2.4. Màn hình Cơ hội

#### Chức năng chính

- Tạo cơ hội từ khách hàng
- Theo dõi giai đoạn cơ hội
- Gán nhân viên phụ trách
- Tạo báo giá từ cơ hội

#### Trạng thái / giai đoạn đề xuất

- Mới tạo
- Đang tư vấn
- Đã gửi thông tin
- Chờ báo giá
- Đã tạo báo giá
- Tạm dừng
- Thất bại
- Thành công

#### Thông tin cần có

- Khách hàng
- Tiêu đề cơ hội
- Nhu cầu của khách
- Giá trị dự kiến
- Ngày dự kiến chốt
- Nhân viên phụ trách
- Giai đoạn
- Ghi chú

---

### 2.5. Màn hình Báo giá

#### Chức năng chính

- Tạo báo giá từ cơ hội
- Thêm nhiều dòng chi tiết báo giá
- Tính tổng tiền tự động
- Theo dõi trạng thái báo giá
- Chuyển báo giá thành hợp đồng khi khách đồng ý
- Xuất file báo giá nếu cần

#### Thông tin báo giá

- Số báo giá
- Khách hàng
- Cơ hội liên quan
- Ngày báo giá
- Người lập báo giá
- Trạng thái
- Tổng tiền trước thuế
- Thuế nếu có
- Tổng tiền sau thuế
- Ghi chú điều khoản

#### Chi tiết báo giá

- Hạng mục
- Mô tả
- Đơn vị tính
- Số lượng
- Đơn giá
- Thành tiền

#### Trạng thái đề xuất

- Nháp
- Đã gửi khách
- Khách yêu cầu sửa
- Đã duyệt
- Khách từ chối
- Đã chuyển hợp đồng

#### Bổ sung cần thiết

- Không cho chuyển thành hợp đồng nếu báo giá chưa ở trạng thái phù hợp.
- Lưu lịch sử các lần sửa báo giá nếu báo giá thay đổi nhiều lần.
- Có thể cần người duyệt báo giá nếu công ty có bước duyệt nội bộ.

---

### 2.6. Màn hình Hợp đồng

#### Chức năng chính

- Tạo hợp đồng từ báo giá
- Theo dõi trạng thái hợp đồng
- Lưu thông tin thanh toán theo đợt
- Khi hợp đồng đã ký thì tự động tạo dự án

#### Thông tin hợp đồng

- Số hợp đồng
- Khách hàng
- Báo giá liên quan
- Ngày ký
- Giá trị hợp đồng
- Người phụ trách
- Trạng thái hợp đồng
- File hợp đồng nếu có
- Ghi chú
- Cờ `DaTaoDuAn` để chống tạo trùng dự án

#### Trạng thái đề xuất

- Nháp
- Đã gửi khách
- Đang đàm phán
- Đã ký
- Tạm dừng
- Hủy
- Hoàn tất

#### Logic tự động tạo dự án

Khi người dùng cập nhật hợp đồng sang trạng thái **Đã ký**:

1. Hệ thống kiểm tra hợp đồng đã có dự án chưa.
2. Nếu chưa có, tự động tạo dự án mới.
3. Dự án lấy thông tin từ hợp đồng:
   - Khách hàng
   - Hợp đồng
   - Tên dự án
   - Người quản lý / người phụ trách
   - Trạng thái mặc định: mới tạo hoặc chờ triển khai
4. Cập nhật lại hợp đồng: `DaTaoDuAn = TRUE`.
5. Gửi thông báo cho người quản lý dự án hoặc người được giao phụ trách.

---

### 2.7. Màn hình Dự án

#### Chức năng chính

- Xem danh sách dự án
- Theo dõi tiến độ dự án
- Giao việc cho nhân sự
- Theo dõi lịch, công việc, ghi chú, nghiệm thu, công nợ

#### Thông tin dự án

- Mã dự án
- Tên dự án
- Khách hàng
- Hợp đồng
- Quản lý dự án
- Ngày bắt đầu
- Ngày dự kiến hoàn thành
- Trạng thái
- Tiến độ
- Ghi chú

#### Tab trong chi tiết dự án

1. Tổng quan
2. Công việc
3. Lịch chung
4. Ghi chú nội bộ
5. Hồ sơ / file đính kèm
6. Nghiệm thu / đóng dự án
7. Công nợ liên quan

#### Trạng thái đề xuất

- Mới tạo
- Chờ triển khai
- Đang thực hiện
- Tạm dừng
- Chờ nghiệm thu
- Đã nghiệm thu
- Đã đóng
- Hủy

---

### 2.8. Màn hình Công việc

#### Chức năng chính

- Tạo công việc trong dự án
- Giao việc cho nhân sự
- Theo dõi trạng thái công việc
- Ghi chú / phản hồi trong từng công việc

#### Thông tin công việc

- Dự án
- Khách hàng
- Tiêu đề công việc
- Mô tả
- Người phụ trách
- Ngày bắt đầu
- Hạn hoàn thành
- Mức độ ưu tiên
- Trạng thái

#### Trạng thái đề xuất

- Chưa làm
- Đang làm
- Chờ phản hồi
- Hoàn thành
- Quá hạn
- Hủy

#### Bổ sung cần thiết

- Có danh sách việc của tôi để mỗi nhân viên chỉ cần xem việc được giao.
- Có cảnh báo công việc quá hạn.
- Có ghi chú theo công việc để tránh trao đổi rời rạc.

---

### 2.9. Màn hình Lịch chung

#### Chức năng chính

- Tạo lịch theo dự án hoặc khách hàng
- Giao người phụ trách
- Theo dõi lịch hẹn, lịch họp, lịch nghiệm thu, lịch triển khai

#### Thông tin lịch

- Dự án
- Khách hàng
- Loại lịch
- Tiêu đề lịch
- Ngày bắt đầu
- Ngày kết thúc nếu có
- Người phụ trách
- Ghi chú
- Trạng thái

#### Loại lịch đề xuất

- Lịch họp
- Lịch khảo sát
- Lịch triển khai
- Lịch nghiệm thu
- Lịch chăm sóc
- Lịch khác

---

### 2.10. Màn hình Ghi chú nội bộ

#### Chức năng chính

- Tạo ghi chú cho khách hàng, dự án hoặc công việc
- Chọn người nhận ghi chú
- Người nhận phản hồi lại ghi chú
- Theo dõi trạng thái đã đọc / đã xử lý nếu cần

#### Thông tin ghi chú

- Khách hàng
- Dự án
- Công việc liên quan
- Nội dung ghi chú
- Người gửi
- Người nhận
- Ngày gửi
- Trạng thái
- Nội dung phản hồi
- Ngày phản hồi

#### Logic thông báo

- Khi có ghi chú mới: gửi thông báo cho người nhận.
- Khi có phản hồi mới: gửi thông báo cho người tạo ghi chú.

#### Bổ sung cần thiết

- Không nên thiết kế ghi chú chỉ là một ô text trong dự án, vì như vậy khó thông báo và khó theo dõi phản hồi.
- Nên có bảng riêng cho ghi chú hoặc phản hồi để lưu lịch sử trao đổi.

---

### 2.11. Màn hình Công nợ

#### Chức năng chính

- Theo dõi các khoản phải thu theo hợp đồng, dự án hoặc đơn bán hàng
- Theo dõi các đợt thanh toán
- Cảnh báo sắp đến hạn và quá hạn
- Cập nhật trạng thái thanh toán

#### Thông tin công nợ

- Khách hàng
- Hợp đồng hoặc đơn bán hàng
- Dự án nếu có
- Đợt thanh toán
- Ngày đến hạn
- Số tiền phải thu
- Số tiền đã thu
- Số tiền còn lại
- Trạng thái
- Người phụ trách thu

#### Trạng thái đề xuất

- Chưa đến hạn
- Sắp đến hạn
- Đến hạn hôm nay
- Quá hạn
- Đã thu một phần
- Đã thu đủ
- Hủy / không thu

#### Logic nhắc công nợ

- Mỗi ngày hệ thống kiểm tra các công nợ chưa thu đủ.
- Nếu ngày đến hạn còn 3 ngày: gửi thông báo nhắc.
- Nếu ngày hiện tại lớn hơn ngày đến hạn và chưa thu đủ: chuyển sang cảnh báo quá hạn.
- Công nợ quá hạn cần hiện rõ trên Dashboard.

---

### 2.12. Màn hình Chăm sóc khách hàng

#### Chức năng chính

- Tạo lịch chăm sóc khách hàng
- Nhắc chăm sóc theo ngày hẹn
- Ghi nhận kết quả chăm sóc
- Tạo ngày chăm sóc tiếp theo

#### Thông tin cần có

- Khách hàng
- Hợp đồng / dự án liên quan nếu có
- Nội dung cần chăm sóc
- Ngày nhắc hẹn
- Người phụ trách
- Kết quả chăm sóc
- Trạng thái
- Ngày chăm sóc tiếp theo

#### Trạng thái đề xuất

- Chưa đến ngày
- Cần chăm sóc hôm nay
- Đã chăm sóc
- Hẹn lại
- Bỏ qua

#### Logic sau khi chăm sóc

Khi người dùng cập nhật trạng thái là **Đã chăm sóc**:

- Bắt buộc nhập kết quả chăm sóc.
- Cho phép nhập ngày chăm sóc tiếp theo.
- Nếu có ngày chăm sóc tiếp theo, hệ thống tạo một lịch chăm sóc mới hoặc cập nhật bản ghi tiếp theo tùy cách thiết kế.

---

### 2.13. Màn hình Nhà cung ứng

#### Chức năng chính

- Quản lý danh sách nhà cung ứng
- Xem lịch sử mua hàng theo nhà cung ứng
- Lọc nhà cung ứng đang hoạt động / ngừng hợp tác

#### Thông tin cần có

- Tên nhà cung ứng
- Người liên hệ
- Điện thoại
- Email
- Địa chỉ
- Ghi chú
- Trạng thái

---

### 2.14. Màn hình Mua hàng

#### Chức năng chính

- Tạo phiếu mua hàng
- Chọn nhà cung ứng
- Nhập nhiều dòng sản phẩm / hàng hóa
- Tính tổng tiền
- Theo dõi trạng thái mua hàng
- Chuyển sang nhập kho khi hàng về

#### Thông tin phiếu mua

- Số phiếu mua
- Nhà cung ứng
- Ngày mua
- Người tạo
- Tổng tiền
- Trạng thái

#### Chi tiết phiếu mua

- Sản phẩm
- Đơn vị tính
- Số lượng
- Đơn giá
- Thành tiền

#### Trạng thái đề xuất

- Nháp
- Đã đặt hàng
- Đã nhận một phần
- Đã nhận đủ
- Hủy

---

### 2.15. Màn hình Nhập kho

#### Chức năng chính

- Tạo phiếu nhập kho từ phiếu mua hàng
- Ghi nhận số lượng thực nhập
- Cập nhật tồn kho
- Theo dõi kho nhập
r
#### Thông tin phiếu nhập

- Số phiếu nhập
- Phiếu mua liên quan
- Ngày nhập
- Kho nhập
- Người nhập
- Trạng thái

#### Bổ sung cần thiết

- Có chi tiết nhập kho theo từng sản phẩm.
- Cho phép nhập thiếu so với phiếu mua nếu thực tế hàng về chưa đủ.
- Sau khi xác nhận nhập kho, tồn kho mới được tăng.

---

### 2.16. Màn hình Tồn kho

#### Chức năng chính

- Xem tồn kho theo sản phẩm và kho
- Theo dõi số lượng tồn
- Cảnh báo tồn thấp nếu có mức tồn tối thiểu
- Xem lịch sử nhập xuất

#### Thông tin cần có

- Sản phẩm
- Kho
- Số lượng tồn
- Đơn vị tính
- Ngày cập nhật
- Mức tồn tối thiểu nếu cần

#### Bổ sung cần thiết

Sơ đồ hiện tại đang thiếu bảng sản phẩm, kho và lịch sử xuất nhập kho. Để quản lý tồn kho ổn hơn, nên bổ sung:

- Danh mục sản phẩm
- Danh mục kho
- Chi tiết nhập kho
- Chi tiết bán hàng
- Lịch sử giao dịch kho

Nếu không bổ sung, tồn kho chỉ là con số tổng, sau này rất khó kiểm tra sai lệch.

---

### 2.17. Màn hình Bán hàng

#### Chức năng chính

- Tạo đơn bán hàng
- Chọn khách hàng thương mại
- Thêm sản phẩm bán
- Tính tổng tiền
- Trừ tồn kho khi xác nhận bán
- Tạo công nợ nếu chưa thu đủ tiền

#### Thông tin đơn bán

- Số đơn bán
- Khách hàng
- Ngày bán
- Người bán
- Tổng tiền
- Đã thu
- Còn nợ
- Trạng thái

#### Trạng thái đề xuất

- Nháp
- Đã xác nhận
- Đã giao hàng
- Đã thu một phầnr
- Đã thu đủ
- Hủy

---

### 2.18. Màn hình Báo cáo

#### Báo cáo cho luồng dịch vụ

- Báo cáo khách hàng mới
- Báo cáo cơ hội theo giai đoạn
- Báo cáo báo giá theo trạng thái
- Báo cáo hợp đồng đã ký
- Báo cáo dự án đang thực hiện
- Báo cáo công việc quá hạn
- Báo cáo công nợ sắp đến hạn / quá hạn
- Báo cáo chăm sóc khách hàng

#### Báo cáo cho luồng thương mại

- Báo cáo mua hàng
- Báo cáo nhập kho
- Báo cáo tồn kho
- Báo cáo bán hàng
- Báo cáo công nợ bán hàng

#### Bộ lọc báo cáo

- Từ ngày đến ngày
- Khách hàng
- Nhân viên phụ trách
- Trạng thái
- Nhà cung ứng
- Sản phẩm
- Kho

---

### 2.19. Màn hình Danh mục - Cấu hình

#### Mục đích

Dùng để quản lý các dữ liệu dùng chung, tránh nhập tay lung tung.

#### Danh mục nên có

- Trạng thái khách hàng
- Giai đoạn cơ hội
- Trạng thái báo giá
- Trạng thái hợp đồng
- Trạng thái dự án
- Trạng thái công việc
- Loại lịch
- Trạng thái công nợ
- Loại khách hàng
- Đơn vị tính
- Danh mục sản phẩm
- Danh mục kho
- Danh mục phòng ban
- Nhóm quyền / vai trò RBAC

---

### 2.20. Màn hình Quản trị người dùng và phân quyền

#### Định hướng phân quyền

Không thiết kế phân quyền bằng danh sách vai trò cố định trong code.

Các tên như quản trị hệ thống, kinh doanh, kế toán, kho, dự án chỉ nên là **nhóm quyền mẫu** để khởi tạo ban đầu. Khi vận hành thật, người có quyền cấu hình hệ thống phải có thể tạo vai trò mới, đổi tên vai trò, bật/tắt vai trò và thay đổi danh sách quyền mà không cần sửa code.

Hệ thống nên dùng mô hình **RBAC (Role-Based Access Control)**:

- Một người dùng có thể được gán một hoặc nhiều vai trò.
- Một vai trò là một nhóm quyền.
- Một quyền mô tả rõ người dùng được làm gì, trên module nào và trong phạm vi dữ liệu nào.
- Logic kiểm tra quyền phải nằm ở backend, không dựa vào dữ liệu quyền gửi từ client.

#### Cấu trúc quyền đề xuất

Mỗi quyền nên được chuẩn hóa theo cấu trúc:

```txt
module.action.scope
```

Trong đó:

- `module`: khu vực chức năng
- `action`: hành động được phép thực hiện
- `scope`: phạm vi dữ liệu được phép tác động

Ví dụ:

- `customers.view.own`
- `customers.view.team`
- `customers.view.all`
- `customers.create.all`
- `customers.update.own`
- `customers.delete.all`
- `quotes.approve.team`
- `contracts.sign.all`
- `projects.assign.team`
- `receivables.update_status.all`
- `inventory.adjust.all`
- `reports.export.team`

#### Module phân quyền

Các module nên có quyền riêng:

- Dashboard
- Khách hàng
- Người liên hệ
- Cơ hội
- Báo giá
- Hợp đồng
- Dự án
- Công việc
- Lịch chung
- Ghi chú nội bộ
- Công nợ
- Chăm sóc khách hàng
- Nhà cung ứng
- Mua hàng
- Nhập kho
- Tồn kho
- Bán hàng
- Báo cáo
- Danh mục / cấu hình
- Người dùng
- Vai trò và quyền
- Nhật ký hệ thống

#### Hành động phân quyền

Các hành động nên dùng thống nhất:

- `view`
- `create`
- `update`
- `delete`
- `approve`
- `reject`
- `assign`
- `export`
- `import`
- `adjust`
- `configure`

Không phải module nào cũng cần tất cả hành động. Ví dụ:

- `inventory.adjust` là quyền nhạy cảm để điều chỉnh tồn kho.
- `contracts.sign` là quyền nhạy cảm để xác nhận hợp đồng đã ký.
- `receivables.update_status` là quyền nhạy cảm để cập nhật trạng thái thu tiền.
- `settings.configure` là quyền nhạy cảm để thay đổi cấu hình hệ thống.

#### Phạm vi dữ liệu

Quyền nên hỗ trợ phạm vi dữ liệu:

- `own`: chỉ dữ liệu do người dùng tạo, phụ trách hoặc được giao
- `team`: dữ liệu của nhóm / team
- `department`: dữ liệu của phòng ban
- `all`: toàn bộ dữ liệu trong hệ thống

Ví dụ cùng là quyền xem khách hàng:

- Nhân viên kinh doanh có thể được cấp `customers.view.own`.
- Trưởng nhóm có thể được cấp `customers.view.team`.
- Người quản lý toàn hệ thống có thể được cấp `customers.view.all`.

#### Nhóm quyền mẫu ban đầu

Có thể tạo sẵn một số nhóm quyền mẫu để dễ cấu hình lúc khởi tạo hệ thống. Các nhóm này chỉ là dữ liệu cấu hình, không phải logic cố định:

1. **System Management**
   - Quản lý người dùng, vai trò, quyền, danh mục và cấu hình
   - Xem dữ liệu toàn hệ thống nếu được cấp quyền `*.view.all`

2. **Business Management**
   - Xem dữ liệu kinh doanh theo phạm vi được cấp
   - Theo dõi khách hàng, cơ hội, báo giá, hợp đồng và báo cáo
   - Giao việc hoặc phân công nếu có quyền `assign`

3. **Sales Operation**
   - Quản lý khách hàng, cơ hội, báo giá, hợp đồng và lịch chăm sóc trong phạm vi được giao

4. **Project Operation**
   - Xem dự án được giao
   - Xử lý công việc, lịch, ghi chú và hồ sơ nghiệm thu trong phạm vi được cấp

5. **Finance Operation**
   - Xem hợp đồng, đơn bán và công nợ trong phạm vi được cấp
   - Cập nhật trạng thái thu tiền nếu có quyền tương ứng
   - Xuất báo cáo công nợ nếu có quyền `export`

6. **Inventory And Commerce Operation**
   - Quản lý nhà cung ứng, mua hàng, nhập kho, tồn kho và bán hàng trong phạm vi được cấp

#### Yêu cầu bảo mật

- Không tin quyền hoặc vai trò gửi từ client.
- Mọi API phải kiểm tra quyền ở backend.
- Các hành động nhạy cảm như xóa, duyệt, ký hợp đồng, xác nhận nhập kho, điều chỉnh tồn kho, xuất dữ liệu và cấu hình hệ thống phải có quyền riêng.
- Nên ghi log thao tác cho hành động nhạy cảm.
- Khi người dùng bị khóa hoặc vai trò bị tắt, quyền liên quan phải ngừng hiệu lực ngay.
- Khi thay đổi quyền của một vai trò, cần đảm bảo phiên đăng nhập hoặc cache quyền được làm mới theo cơ chế an toàn.
