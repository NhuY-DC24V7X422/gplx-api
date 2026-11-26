import { AdminQuestionsService } from './admin-question.service';

const ID = '000000000000000000000001';

// câu hỏi đang có trong "database giả"
const oldQuestion = {
  _id: ID,
  number: 1,
  content: 'Câu cũ',
  options: [
    { key: '1', text: 'A' },
    { key: '2', text: 'B' },
  ],
  correctKey: '1',
  status: 'active',
  version: 1,
};

// dữ liệu admin gửi lên
const dto = {
  content: 'Đường cấm',
  options: oldQuestion.options,
  correctKey: '1',
  isCritical: false,
  status: 'active',
};

// hàm giả của mongoose: .lean() trả về kết quả
const withLean = (value: any) => ({ lean: () => Promise.resolve(value) });

describe('AdminQuestionsService.update', () => {
  let questionModel: any;
  let stateModel: any;
  let service: AdminQuestionsService;

  beforeEach(() => {
    // test không kết nối MongoDB thật, dùng đối tượng giả
    questionModel = {
      findById: jest.fn(() => withLean(oldQuestion)),
      findByIdAndUpdate: jest.fn((_id, update) =>
        withLean({ ...oldQuestion, ...update.$set }),
      ),
    };
    stateModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ publishedVersion: 5 }),
    };
    const connection: any = {
      transaction: (work: any) => work('session-gia'),
    };
    service = new AdminQuestionsService(questionModel, stateModel, connection);
  });

  // phần $set mà service gửi xuống database
  const savedData = () => questionModel.findByIdAndUpdate.mock.calls[0][1].$set;

  it('sửa nội dung: lấy phiên bản mới, tạo lại searchText', async () => {
    const result = await service.update(ID, dto);

    expect(result.version).toBe(5);
    expect(savedData().searchText).toBe('duong cam');
    expect(savedData().answerChangedAt).toBeUndefined();
  });

  it('đổi đáp án đúng thì ghi answerChangedAt', async () => {
    await service.update(ID, { ...dto, correctKey: '2' });

    expect(savedData().answerChangedAt).toBeInstanceOf(Date);
  });

  it('đáp án đúng không có trong danh sách thì báo lỗi, không tăng phiên bản', async () => {
    await expect(
      service.update(ID, { ...dto, correctKey: '9' }),
    ).rejects.toMatchObject({ code: 'INVALID_CORRECT_KEY' });
    expect(stateModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('2 đáp án trùng mã thì báo lỗi', async () => {
    const options = [
      { key: '1', text: 'A' },
      { key: '1', text: 'B' },
    ];
    await expect(service.update(ID, { ...dto, options })).rejects.toMatchObject(
      { code: 'DUPLICATE_KEY' },
    );
  });

  it('id sai định dạng thì báo không tồn tại', async () => {
    await expect(service.update('abc', dto)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
