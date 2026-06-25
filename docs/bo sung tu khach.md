## **MODULE VÀ TRƯỜNG THÔNG TIN WEBAPP RÚT GỌN** 

_Áp dụng cho công ty dịch vụ tư vấn kết hợp thương mại_ 

## **I. KHỐI TƯ VẤN - KINH DOANH** 

## **1. Khách hàng  |  Bảng: customers  |  Khóa chính: customer_id** 

|**STT**|**Tên trường**|**Ý nghĩa sử dụng**|**Liên kết module**|
|---|---|---|---|
|1|Mã khách hàng<br>customer_code|Mã nhận diện khách hàng|Không|
|2|Tên công ty<br>company_name|Tên doanh nghiệp/khách hàng|Không|
|3|Mã số thuế<br>tax_code|Thông tin pháp lý cơ bản|Không|
|4|Ngành nghề<br>industry_id|Phân loại khách hàng|Danh mục|
|5|Địa chỉ<br>address|Địa chỉ giao dịch|Không|
|6|Điện thoại<br>phone|Số liên hệ chính|Không|
|7|Email<br>email|Email chính|Không|
|8|Nguồn khách hàng<br>customer_source_id|Nguồn phát sinh khách hàng|Danh mục|
|9|Nhân viên phụ trách<br>assigned_sales_id|Người chăm sóc và theo dõi|Người dùng|
|10|Trạng thái khách hàng<br>customer_status|Mới, đang chăm sóc, đã giao dịch|Danh mục|
|11|Ngày chăm sóc tiếp theo<br>next_contact_date|Ngày cần liên hệ lại|Chăm sóc khách hàng|
|12|Ghi chú<br>notes|Thông tin cần lưu ý|Không|



## **2. Người liên hệ  |  Bảng: customer_contacts  |  Khóa chính: contact_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Khách hàng<br>customer_id|Công ty của người liên hệ|Khách hàng|
|2|Họ tên<br>full_name|Tên người liên hệ|Không|
|3|Chức vụ<br>position|Chức vụ tại khách hàng|Không|
|4|Bộ phận<br>department|Bộ phận làm việc|Không|
|5|Điện thoại<br>phone|Số điện thoại|Không|
|6|Email|Email liên hệ|Không|



||email|||
|---|---|---|---|
|7|Vai trò liên hệ<br>contact_role|Quyết định, phối hợp, kế toán|Danh mục|
|8|Liên hệ chính<br>is_primary|Đầu mối chính của khách hàng|Không|



## **3. Cơ hội  |  Bảng: opportunities  |  Khóa chính: opportunity_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Mã cơ hội<br>opportunity_code|Mã theo dõi cơ hội|Không|
|2|Khách hàng<br>customer_id|Khách hàng có nhu cầu|Khách hàng|
|3|Người liên hệ<br>contact_id|Đầu mối trao đổi|Người liên hệ|
|4|Tên cơ hội<br>opportunity_name|Tên nhu cầu/cơ hội|Không|
|5|Nhu cầu khách hàng<br>requirement_summary|Mô tả yêu cầu chính|Không|
|6|Dịch vụ quan tâm<br>service_id|Loại dịch vụ tư vấn|Danh mục|
|7|Giá trị dự kiến<br>expected_value|Doanh thu dự kiến|Không|
|8|Giai đoạn<br>stage|Mới, khảo sát, báo giá, đàm phán|Danh mục|
|9|Ngày dự kiến chốt<br>expected_close_date|Thời điểm dự kiến ký|Không|
|10|Nhân viên phụ trách<br>assigned_sales_id|Người theo dõi cơ hội|Người dùng|
|11|Trạng thái<br>status|Mở, thành công, thất bại|Danh mục|



## **4. Báo giá  |  Bảng: quotations  |  Khóa chính: quotation_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Số báo giá<br>quotation_number|Số nhận diện báo giá|Không|
|2|Khách hàng<br>customer_id|Khách nhận báo giá|Khách hàng|
|3|Cơ hội<br>opportunity_id|Cơ hội tạo ra báo giá|Cơ hội|
|4|Ngày báo giá<br>quotation_date|Ngày lập báo giá|Không|
|5|Ngày hết hiệu lực<br>expiry_date|Hạn hiệu lực báo giá|Không|
|6|Tổng trước thuế<br>subtotal|Tổng giá trị chưa VAT|Chi tiết báo giá|
|7|Thuế suất<br>vat_rate|Thuế VAT áp dụng|Danh mục|
|8|Tổng thanh toán<br>total_amount|Tổng giá trị sau thuế|Chi tiết báo giá|
|9|Điềukiệnthanhtoán|Điềukhoảnthu tiền|Không|



||payment_terms|||
|---|---|---|---|
|10|Thời gian thực hiện<br>implementation_time|Thời gian dự kiến triển khai|Không|
|11|Người lập<br>prepared_by|Người tạo báo giá|Người dùng|
|12|Người duyệt<br>approved_by|Người phê duyệt|Người dùng|
|13|Trạng thái<br>status|Nháp, chờ duyệt, đã gửi, chấp nhận|Danh mục|
|14|File báo giá<br>quotation_file|Tệp báo giá phát hành|Tệp đính kèm|



## **5. Chi tiết báo giá  |  Bảng: quotation_items  |  Khóa chính: quotation_item_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Báo giá<br>quotation_id|Báo giá chứa dòng này|Báo giá|
|2|Dịch vụ/hạng mục<br>item_name|Tên dịch vụ hoặc hạng mục|Danh mục|
|3|Mô tả<br>description|Phạm vi công việc|Không|
|4|Số lượng<br>quantity|Số lượng thực hiện|Không|
|5|Đơn vị tính<br>unit_id|Gói, ngày, lần, hồ sơ|Danh mục|
|6|Đơn giá<br>unit_price|Giá bán đơn vị|Không|
|7|Thành tiền<br>line_amount|Giá trị dòng báo giá|Báo giá|



## **6. Hợp đồng  |  Bảng: contracts  |  Khóa chính: contract_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Số hợp đồng<br>contract_number|Số nhận diện hợp đồng|Không|
|2|Khách hàng<br>customer_id|Bên ký hợp đồng|Khách hàng|
|3|Báo giá<br>quotation_id|Báo giá được chấp thuận|Báo giá|
|4|Tên hợp đồng<br>contract_name|Tên dịch vụ/hợp đồng|Không|
|5|Ngày ký<br>signed_date|Ngày ký chính thức|Không|
|6|Ngày bắt đầu<br>start_date|Ngày triển khai|Dự án|
|7|Ngày kết thúc dự kiến<br>expected_end_date|Hạn hoàn thành|Dự án|
|8|Tổng giá trị<br>total_amount|Giá trị hợp đồng|Công nợ tư vấn|
|9|Điều khoản thanh toán<br>payment_terms|Điều kiện thu tiền|Đợt thanh toán|
|10|Quản lýhợpđồng|Ngườichịu trách nhiệm|Ngườidùng|



||contract_manager_id|||
|---|---|---|---|
|11|Trạng thái<br>status|Chờ ký, đã ký, đang thực hiện, hoàn thành|Danh mục|
|12|File hợp đồng<br>contract_file|Tệp hợp đồng ký|Tệp đính kèm|
|13|Dự án đã tạo<br>created_project_id|Dự án phát sinh từ hợp đồng|Dự án|



## **7. Đợt thanh toán  |  Bảng: payment_milestones  |  Khóa chính: milestone_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Hợp đồng<br>contract_id|Hợp đồng áp dụng|Hợp đồng|
|2|Tên đợt<br>milestone_name|Tên lần thanh toán|Không|
|3|Tỷ lệ thanh toán<br>payment_rate|Tỷ lệ theo hợp đồng|Không|
|4|Số tiền phải thu<br>amount_due|Số tiền của đợt|Công nợ tư vấn|
|5|Ngày đến hạn<br>due_date|Hạn thanh toán|Thông báo|
|6|Số tiền đã thu<br>paid_amount|Khoản đã nhận|Công nợ tư vấn|
|7|Số tiền còn lại<br>balance_amount|Khoản chưa thu|Công nợ tư vấn|
|8|Trạng thái<br>status|Chưa đến hạn, đến hạn, đã thu, quá hạn|Danh mục|



## **8. Công nợ tư vấn  |  Bảng: consulting_receivables  |  Khóa chính: receivable_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Khách hàng<br>customer_id|Khách hàng phải thanh toán|Khách hàng|
|2|Hợp đồng<br>contract_id|Hợp đồng phát sinh công nợ|Hợp đồng|
|3|Đợt thanh toán<br>milestone_id|Mốc thanh toán|Đợt thanh toán|
|4|Số hóa đơn<br>invoice_number|Số hóa đơn/chứng từ|Không|
|5|Ngày hóa đơn<br>invoice_date|Ngày lập hóa đơn|Không|
|6|Hạn thanh toán<br>due_date|Ngày phải thanh toán|Thông báo|
|7|Số phải thu<br>amount_due|Tổng phải thu|Không|
|8|Số đã thu<br>amount_paid|Tổng đã nhận|Không|
|9|Còn lại<br>balance_amount|Số chưa thu|Không|
|10|Số ngày quá hạn<br>overdue_days|Số ngày trễ|Thông báo|
|11|Ngườitheo dõi|Ngườiphụ tráchthuhồi|Ngườidùng|



assigned_user_id Trạng thái 12 payment_status 

Chưa thu, thu một phần, đã thu, quá hạn Danh mục 

## **9. Chăm sóc khách hàng  |  Bảng: customer_care  |  Khóa chính: care_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Khách hàng<br>customer_id|Khách hàng cần chăm sóc|Khách hàng|
|2|Người liên hệ<br>contact_id|Đầu mối chăm sóc|Người liên hệ|
|3|Người phụ trách<br>assigned_user_id|Người thực hiện chăm sóc|Người dùng|
|4|Ngày chăm sóc<br>scheduled_date|Thời gian liên hệ|Thông báo|
|5|Hình thức<br>care_type|Gọi điện, Zalo, email, gặp trực tiếp|Danh mục|
|6|Nội dung<br>care_content|Nội dung cần trao đổi|Không|
|7|Kết quả<br>care_result|Kết quả thực hiện|Không|
|8|Ngày chăm sóc tiếp theo<br>next_care_date|Ngày liên hệ lại|Thông báo|
|9|Trạng thái<br>status|Chưa thực hiện, đã thực hiện, dời lịch|Danh mục|



## **II. KHỐI THỰC HIỆN** 

## **10. Dự án  |  Bảng: projects  |  Khóa chính: project_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Mã dự án<br>project_code|Mã theo dõi dự án|Không|
|2|Hợp đồng<br>contract_id|Hợp đồng tạo dự án|Hợp đồng|
|3|Khách hàng<br>customer_id|Khách hàng của dự án|Khách hàng|
|4|Tên dự án<br>project_name|Tên dự án/dịch vụ|Không|
|5|Phạm vi dự án<br>project_scope|Nội dung thực hiện|Không|
|6|Quản lý dự án<br>project_manager_id|Người chịu trách nhiệm chính|Người dùng|
|7|Thành viên thực hiện<br>team_members|Nhóm triển khai|Người dùng|
|8|Ngày bắt đầu<br>start_date|Ngày khởi động|Không|
|9|Ngày kết thúc dự kiến<br>expected_end_date|Hạn hoàn thành|Thông báo|
|10|Tiếnđộ|Phầntrăm hoànthành|Côngviệc|



||progress_percent|||
|---|---|---|---|
|11|Trạng thái<br>project_status|Mới, đang thực hiện, chờ khách, hoàn thành|Danh mục|
|12|Thư mục hồ sơ<br>folder_url|Nơi lưu tài liệu dự án|Tệp đính kèm|



## **11. Lịch chung  |  Bảng: calendar_events  |  Khóa chính: event_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Khách hàng<br>customer_id|Khách hàng liên quan|Khách hàng|
|2|Dự án<br>project_id|Dự án liên quan|Dự án|
|3|Loại lịch<br>event_type|Họp, khảo sát, đào tạo, đánh giá|Danh mục|
|4|Tiêu đề<br>title|Tên sự kiện|Không|
|5|Thời gian bắt đầu<br>start_datetime|Thời gian diễn ra|Thông báo|
|6|Thời gian kết thúc<br>end_datetime|Thời gian kết thúc|Không|
|7|Địa điểm<br>location|Nơi thực hiện|Không|
|8|Người phụ trách<br>owner_id|Người chịu trách nhiệm|Người dùng|
|9|Người tham gia<br>internal_attendees|Nhân sự tham gia|Người dùng|
|10|Trạng thái<br>status|Dự kiến, xác nhận, hoàn thành, hoãn|Danh mục|



## **12. Công việc  |  Bảng: tasks  |  Khóa chính: task_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Dự án<br>project_id|Dự án chứa công việc|Dự án|
|2|Tiêu đề công việc<br>task_title|Tên việc cần làm|Không|
|3|Nội dung<br>task_description|Mô tả chi tiết|Không|
|4|Người giao<br>assigned_by|Người tạo/giao việc|Người dùng|
|5|Người phụ trách<br>assigned_to|Người thực hiện|Người dùng|
|6|Người phối hợp<br>collaborators|Người hỗ trợ|Người dùng|
|7|Ngày bắt đầu<br>start_date|Ngày thực hiện|Không|
|8|Hạn hoàn thành<br>due_date|Hạn xử lý|Thông báo|
|9|Mức độ ưu tiên<br>priority|Cao, trung bình, thấp|Danh mục|
|10|Tiến độ|Phần trăm hoàn thành|Dự án|



||progress_percent|||
|---|---|---|---|
|11|Trạng thái<br>status|Chưa làm, đang làm, chờ phản hồi, hoàn thành|Danh mục|
|12|Kết quả<br>result|Kết quả hoàn thành|Không|



## **13. Ghi chú nội bộ  |  Bảng: internal_notes  |  Khóa chính: note_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Dự án<br>project_id|Dự án liên quan|Dự án|
|2|Công việc<br>task_id|Công việc liên quan|Công việc|
|3|Tiêu đề<br>note_title|Tên nội dung trao đổi|Không|
|4|Nội dung<br>note_content|Thông tin cần trao đổi|Không|
|5|Người gửi<br>sender_id|Người tạo ghi chú|Người dùng|
|6|Người nhận<br>recipient_users|Người cần nhận thông tin|Người dùng|
|7|Cần phản hồi<br>requires_response|Có yêu cầu trả lời không|Không|
|8|Hạn phản hồi<br>response_due_date|Ngày cần phản hồi|Thông báo|
|9|Trạng thái<br>status|Mới, đã phản hồi, đã đóng|Danh mục|



## **14. Đóng dự án  |  Bảng: project_closures  |  Khóa chính: closure_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Dự án<br>project_id|Dự án cần đóng|Dự án|
|2|Ngày đóng<br>closure_date|Ngày kết thúc chính thức|Không|
|3|Kết quả tổng kết<br>completion_summary|Tóm tắt kết quả|Không|
|4|Tình trạng nghiệm thu<br>acceptance_status|Chưa nghiệm thu, đã nghiệm thu|Danh mục|
|5|Biên bản nghiệm thu<br>acceptance_file|Tệp nghiệm thu|Tệp đính kèm|
|6|Công nợ hoàn tất<br>receivable_completed|Đã thu đủ hay chưa|Công nợ tư vấn|
|7|Trạng thái lưu trữ<br>archive_status|Đã lưu hồ sơ hay chưa|Danh mục|
|8|Người đóng dự án<br>closed_by|Người xác nhận đóng|Người dùng|



## **III. KHỐI THƯƠNG MẠI** 

## **15. Nhà cung ứng  |  Bảng: suppliers  |  Khóa chính: supplier_id** 

|**STT**|**Tên trường**|**Ý nghĩa sử dụng**|**Liên kết module**|
|---|---|---|---|
|1|Mã nhà cung ứng<br>supplier_code|Mã nhận diện nhà cung ứng|Không|
|2|Tên nhà cung ứng<br>supplier_name|Tên doanh nghiệp cung cấp|Không|
|3|Mã số thuế<br>tax_code|Thông tin pháp lý|Không|
|4|Người liên hệ<br>contact_person|Đầu mối nhà cung ứng|Không|
|5|Điện thoại<br>phone|Số liên hệ|Không|
|6|Email<br>email|Email giao dịch|Không|
|7|Địa chỉ<br>address|Địa chỉ nhà cung ứng|Không|
|8|Điều khoản thanh toán<br>payment_terms|Thời hạn và cách thanh toán|Đơn mua hàng|
|9|Hạn mức tín dụng<br>credit_limit|Hạn mức công nợ|Công nợ thương mại|
|10|Trạng thái<br>status|Đang hợp tác, tạm ngưng|Danh mục|



## **16. Sản phẩm  |  Bảng: products  |  Khóa chính: product_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Mã hàng<br>product_code|Mã nhận diện sản phẩm|Không|
|2|Tên hàng<br>product_name|Tên sản phẩm/hàng hóa|Không|
|3|Nhóm hàng<br>product_group_id|Phân loại sản phẩm|Danh mục|
|4|Đơn vị tính<br>unit_id|Cái, kg, cuộn, bộ...|Danh mục|
|5|Quy cách<br>specification|Thông số/quy cách hàng|Không|
|6|Giá vốn chuẩn<br>standard_cost|Giá nhập tham khảo|Tồn kho|
|7|Giá bán đề xuất<br>selling_price|Giá bán tham khảo|Đơn bán hàng|
|8|Tồn tối thiểu<br>minimum_stock|Mức cảnh báo tồn|Tồn kho|
|9|Nhà cung ứng mặc định<br>default_supplier_id|NCC thường mua|Nhà cung ứng|
|10|Trạng thái<br>status|Đang kinh doanh, tạm ngưng|Danh mục|



## **17. Kho  |  Bảng: warehouses  |  Khóa chính: warehouse_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Mã kho<br>warehouse_code|Mã nhận diện kho|Không|
|2|Tên kho<br>warehouse_name|Tên kho hàng|Không|
|3|Địa chỉ<br>address|Vị trí kho|Không|
|4|Quản lý kho<br>warehouse_manager_id|Người phụ trách kho|Người dùng|
|5|Trạng thái<br>status|Hoạt động, tạm ngưng|Danh mục|



## **18. Đơn mua hàng  |  Bảng: purchase_orders  |  Khóa chính: purchase_order_id** 

|**STT**|**Tên trường**|**Ý nghĩa sử dụng**|**Liên kết module**|
|---|---|---|---|
|1|Số đơn mua<br>purchase_order_number|Mã đơn mua|Không|
|2|Nhà cung ứng<br>supplier_id|Nhà cung cấp hàng|Nhà cung ứng|
|3|Ngày đặt<br>order_date|Ngày tạo đơn mua|Không|
|4|Ngày giao dự kiến<br>expected_delivery_date|Hạn giao hàng|Thông báo|
|5|Kho nhận<br>warehouse_id|Kho dự kiến nhập|Kho|
|6|Tổng tiền<br>total_amount|Tổng giá trị đơn mua|Chi tiết đơn mua|
|7|Đã thanh toán<br>paid_amount|Số đã trả|Công nợ thương mại|
|8|Còn phải trả<br>balance_amount|Số còn nợ NCC|Công nợ thương mại|
|9|Hạn thanh toán<br>payment_due_date|Hạn trả tiền|Thông báo|
|10|Người mua<br>buyer_id|Người phụ trách mua|Người dùng|
|11|Trạng thái<br>status|Nháp, chờ duyệt, đã duyệt, hoàn tất|Danh mục|



## **19. Chi tiết đơn mua  |  Bảng: purchase_order_items  |  Khóa chính: purchase_item_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Đơn mua<br>purchase_order_id|Đơn mua chứa dòng hàng|Đơn mua hàng|
|2|Sản phẩm<br>product_id|Hàng hóa cần mua|Sản phẩm|
|3|Số lượng đặt<br>quantity_ordered|Số lượng cần mua|Không|
|4|Số lượng đã nhận<br>quantity_received|Số đã nhập kho|Phiếu nhập kho|
|5|Đơngiá|Giámua đơn vị|Không|



||unit_price|||
|---|---|---|---|
|6|Thành tiền<br>line_amount|Giá trị dòng hàng|Đơn mua hàng|



## **20. Phiếu nhập kho  |  Bảng: goods_receipts  |  Khóa chính: receipt_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Số phiếu nhập<br>receipt_number|Mã phiếu nhập|Không|
|2|Đơn mua<br>purchase_order_id|Đơn mua liên quan|Đơn mua hàng|
|3|Nhà cung ứng<br>supplier_id|NCC giao hàng|Nhà cung ứng|
|4|Kho nhập<br>warehouse_id|Kho nhận hàng|Kho|
|5|Ngày nhập<br>receipt_date|Ngày nhận hàng|Không|
|6|Người nhận<br>received_by|Người thực hiện nhập|Người dùng|
|7|Tổng số lượng<br>total_quantity|Tổng hàng nhận|Chi tiết nhập kho|
|8|Tình trạng chất lượng<br>quality_status|Đạt, không đạt, chờ kiểm tra|Danh mục|
|9|Trạng thái<br>status|Nháp, đã xác nhận|Danh mục|



## **21. Chi tiết nhập kho  |  Bảng: goods_receipt_items  |  Khóa chính: receipt_item_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Phiếu nhập<br>receipt_id|Phiếu nhập chứa dòng này|Phiếu nhập kho|
|2|Sản phẩm<br>product_id|Sản phẩm nhập kho|Sản phẩm|
|3|Số lượng nhập<br>quantity_received|Số lượng thực nhập|Tồn kho|
|4|Số lượng lỗi<br>rejected_quantity|Số lượng không đạt|Không|
|5|Giá nhập<br>unit_cost|Giá vốn nhập kho|Tồn kho|
|6|Số lô<br>batch_number|Mã lô hàng|Giao dịch kho|
|7|Vị trí kho<br>storage_location|Kệ/vị trí lưu|Kho|



## **22. Đơn bán hàng  |  Bảng: sales_orders  |  Khóa chính: sales_order_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Số đơn bán<br>sales_order_number|Mã đơn bán|Không|
|2|Khách hàng<br>customer_id|Khách mua hàng|Khách hàng|



|3|Người liên hệ<br>contact_id|Đầu mối nhận hàng|Người liên hệ|
|---|---|---|---|
|4|Ngày bán<br>order_date|Ngày tạo đơn|Không|
|5|Ngày giao dự kiến<br>expected_delivery_date|Ngày dự kiến giao|Thông báo|
|6|Kho xuất<br>warehouse_id|Kho cấp hàng|Kho|
|7|Tổng tiền<br>total_amount|Tổng giá trị đơn bán|Chi tiết đơn bán|
|8|Đã thu<br>paid_amount|Số đã nhận|Công nợ thương mại|
|9|Còn phải thu<br>balance_amount|Số khách còn nợ|Công nợ thương mại|
|10|Hạn thanh toán<br>payment_due_date|Hạn thu tiền|Thông báo|
|11|Nhân viên bán hàng<br>sales_person_id|Người phụ trách đơn|Người dùng|
|12|Trạng thái<br>status|Nháp, chờ duyệt, đang giao, hoàn tất|Danh mục|
|**n bán  |  Bảng: sales_order_items  |  Khóa chính: sales_item_id**||||
|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|1|Đơn bán<br>sales_order_id|Đơn bán chứa dòng hàng|Đơn bán hàng|
|2|Sản phẩm<br>product_id|Hàng hóa bán|Sản phẩm|
|3|Số lượng bán<br>quantity_ordered|Số lượng khách mua|Tồn kho|
|4|Số lượng đã giao<br>quantity_delivered|Số đã xuất kho|Phiếu xuất kho|
|5|Đơn giá<br>unit_price|Giá bán đơn vị|Không|
|6|Thành tiền<br>line_amount|Giá trị dòng bán|Đơn bán hàng|
|7|Giá vốn<br>estimated_cost|Giá vốn hàng bán|Tồn kho|
|8|Lợi nhuận gộp<br>gross_profit|Lãi gộp theo dòng|Báo cáo|



## **23. Chi tiết đơn bán  |  Bảng: sales_order_items  |  Khóa chính: sales_item_id** 

## **24. Phiếu xuất kho  |  Bảng: goods_issues  |  Khóa chính: issue_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Số phiếu xuất<br>issue_number|Mã phiếu xuất|Không|
|2|Đơn bán<br>sales_order_id|Đơn bán liên quan|Đơn bán hàng|
|3|Khách hàng<br>customer_id|Khách nhận hàng|Khách hàng|
|4|Kho xuất<br>warehouse_id|Kho giao hàng|Kho|



|5|Ngày xuất<br>issue_date|Ngày xuất hàng|Không|
|---|---|---|---|
|6|Người xuất<br>issued_by|Người thực hiện xuất|Người dùng|
|7|Tổng số lượng<br>total_quantity|Tổng hàng xuất|Chi tiết xuất kho|
|8|Trạng thái<br>status|Nháp, đã xác nhận, đã giao|Danh mục|



## **25. Chi tiết xuất kho  |  Bảng: goods_issue_items  |  Khóa chính: issue_item_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Phiếu xuất<br>issue_id|Phiếu xuất chứa dòng này|Phiếu xuất kho|
|2|Sản phẩm<br>product_id|Sản phẩm xuất kho|Sản phẩm|
|3|Số lượng xuất<br>quantity_issued|Số lượng thực xuất|Tồn kho|
|4|Giá vốn<br>unit_cost|Giá vốn xuất kho|Tồn kho|
|5|Số lô<br>batch_number|Lô hàng xuất|Giao dịch kho|
|6|Vị trí kho<br>storage_location|Vị trí lấy hàng|Kho|



## **26. Tồn kho  |  Bảng: inventory_balances  |  Khóa chính: inventory_id** 

|**STT**|**Tên trường**|**Ý nghĩa sử dụng**|**Liên kết module**|
|---|---|---|---|
|1|Kho<br>warehouse_id|Kho quản lý số lượng|Kho|
|2|Sản phẩm<br>product_id|Sản phẩm tồn kho|Sản phẩm|
|3|Tổng nhập<br>total_received|Số lượng đã nhập|Phiếu nhập kho|
|4|Tổng xuất<br>total_issued|Số lượng đã xuất|Phiếu xuất kho|
|5|Tồn hiện tại<br>current_quantity|Số lượng còn trong kho|Không|
|6|Số lượng giữ chỗ<br>reserved_quantity|Hàng giữ cho đơn bán|Đơn bán hàng|
|7|Số lượng có thể bán<br>available_quantity|Tồn khả dụng|Không|
|8|Giá vốn bình quân<br>average_cost|Giá vốn trung bình|Chi tiết nhập kho|
|9|Giá trị tồn<br>inventory_value|Tổng giá trị tồn|Không|
|10|Trạng thái tồn<br>stock_status|Đủ, thấp, thiếu, hết|Danh mục|



## **27. Công nợ thương mại  |  Bảng: trade_receivables_payables  |  Khóa chính: trade_debt_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Loại công nợ<br>debt_type|Phải thu hoặc phải trả|Danh mục|
|2|Khách hàng<br>customer_id|Đối tượng phải thu|Khách hàng|
|3|Nhà cung ứng<br>supplier_id|Đối tượng phải trả|Nhà cung ứng|
|4|Đơn bán<br>sales_order_id|Nguồn công nợ phải thu|Đơn bán hàng|
|5|Đơn mua<br>purchase_order_id|Nguồn công nợ phải trả|Đơn mua hàng|
|6|Số chứng từ<br>document_number|Số hóa đơn/chứng từ|Không|
|7|Ngày chứng từ<br>document_date|Ngày phát sinh|Không|
|8|Hạn thanh toán<br>due_date|Ngày đến hạn|Thông báo|
|9|Tổng tiền<br>original_amount|Tổng phải thu/phải trả|Không|
|10|Đã thanh toán<br>paid_amount|Số đã thanh toán|Không|
|11|Còn lại<br>balance_amount|Số còn nợ|Không|
|12|Số ngày quá hạn<br>overdue_days|Số ngày trễ|Thông báo|
|13|Người theo dõi<br>assigned_user_id|Người phụ trách công nợ|Người dùng|
|14|Trạng thái<br>status|Chưa đến hạn, đến hạn, hoàn tất, quá hạn|Danh mục|



## **IV. DỮ LIỆU DÙNG CHUNG VÀ QUẢN TRỊ** 

## **28. Danh mục dùng chung  |  Bảng: master_data  |  Khóa chính: master_id** 

|**STT**|**Tên trường**|**Ý nghĩasử dụng**|**Liên kết module**|
|---|---|---|---|
|1|Nhóm danh mục<br>master_group|Loại danh mục|Không|
|2|Mã giá trị<br>value_code|Mã nội bộ|Không|
|3|Tên giá trị<br>value_name|Tên hiển thị|Không|
|4|Danh mục cha<br>parent_id|Nhóm cấp trên|Danh mục dùng chung|
|5|Thứ tự<br>sort_order|Thứ tự hiển thị|Không|
|6|Đang sử dụng<br>is_active|Có còn dùng hay không|Không|



## **29. Người dùng  |  Bảng: users  |  Khóa chính: user_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Mã nhân viên<br>employee_code|Mã nhân sự|Không|
|2|Họ tên<br>full_name|Tên người dùng|Không|
|3|Email đăng nhập<br>email|Tài khoản đăng nhập|Không|
|4|Điện thoại<br>phone|Số liên hệ|Không|
|5|Bộ phận<br>department_id|Đơn vị công tác|Danh mục|
|6|Chức vụ<br>position|Chức danh|Không|
|7|Vai trò<br>role_id|Nhóm quyền sử dụng|Vai trò|
|8|Quản lý trực tiếp<br>manager_id|Người quản lý|Người dùng|
|9|Trạng thái<br>status|Hoạt động, khóa, nghỉ việc|Danh mục|



## **30. Vai trò và phân quyền  |  Bảng: role_permissions  |  Khóa chính: role_permission_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Vai trò<br>role_id|Nhóm người dùng|Vai trò|
|2|Module<br>module_name|Module áp dụng quyền|Tất cả module|
|3|Quyền xem<br>can_view|Có được xem không|Không|
|4|Quyền thêm<br>can_create|Có được tạo mới không|Không|
|5|Quyền sửa<br>can_update|Có được chỉnh sửa không|Không|
|6|Quyền duyệt<br>can_approve|Có được duyệt không|Không|
|7|Quyền xuất file<br>can_export|Có được xuất file không|Không|
|8|Phạm vi dữ liệu<br>data_scope|Tất cả, bộ phận, cá nhân|Danh mục|



## **31. Thông báo  |  Bảng: notifications  |  Khóa chính: notification_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Người nhận<br>user_id|Người nhận thông báo|Người dùng|
|2|Loại thông báo<br>notification_type|Công việc, lịch, công nợ, tồn kho|Danh mục|
|3|Tiêu đề<br>title|Tên thông báo|Không|
|4|Nộidung|Nộidung chitiết|Không|



||content|||
|---|---|---|---|
|5|Module phát sinh<br>module_name|Nguồn tạo thông báo|Tất cả module|
|6|Bản ghi liên quan<br>record_id|ID bản ghi nguồn|Module tương ứng|
|7|Đã đọc<br>is_read|Trạng thái đọc|Không|
|8|Thời gian gửi<br>sent_at|Thời điểm gửi|Không|



## **32. Tệp đính kèm  |  Bảng: attachments  |  Khóa chính: attachment_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Module<br>module_name|Module chứa tệp|Tất cả module|
|2|Bản ghi<br>record_id|Bản ghi được đính kèm|Module tương ứng|
|3|Tên file<br>file_name|Tên tệp|Không|
|4|Đường dẫn file<br>file_url|Nơi lưu tệp|Không|
|5|Loại file<br>file_type|PDF, Word, Excel, ảnh|Không|
|6|Người tải lên<br>uploaded_by|Người thêm tệp|Người dùng|
|7|Ngày tải lên<br>uploaded_at|Thời gian tải|Không|



## **33. Nhật ký hệ thống  |  Bảng: audit_logs  |  Khóa chính: log_id** 

|**STT**|**Tên trường**|**Ý nghĩa sửdụng**|**Liên kết module**|
|---|---|---|---|
|1|Người thao tác<br>user_id|Người thực hiện hành động|Người dùng|
|2|Module<br>module_name|Module bị tác động|Tất cả module|
|3|Hành động<br>action_name|Thêm, sửa, xóa, duyệt|Không|
|4|Bản ghi<br>record_id|ID bản ghi bị tác động|Module tương ứng|
|5|Dữ liệu cũ<br>old_value|Giá trị trước thay đổi|Không|
|6|Dữ liệu mới<br>new_value|Giá trị sau thay đổi|Không|
|7|Thời gian<br>action_time|Thời điểm thao tác|Không|



## **V. TRƯỜNG KỸ THUẬT DÙNG CHUNG** 

**Áp dụng** 

**Mục đích** 

**Tên trường** 

|created_at|Tất cả bảng chính|Ngày giờ tạo|
|---|---|---|
|created_by|Tất cảbảng chính|Ngườitạo,liên kết Ngườidùng|
|updated_at|Tất cả bảng chính|Ngày giờ cậpnhật|
|updated_by|Tất cảbảng chính|Ngườicậpnhật|
|status|Bảngnghiệpvụ|Trạng thái xửlý|
|is_active|Khách hàng,NCC, sảnphẩm,ngườidùng, danh mục|Đang sử dụnghay tạm ngưng|
|notes|Bảng cầnghichú|Thông tinbổsung|



_Ghi chú: Các trường đã được rút gọn để phù hợp vận hành thực tế; có thể bổ sung thêm khi phát sinh yêu cầu đặc thù._ 

