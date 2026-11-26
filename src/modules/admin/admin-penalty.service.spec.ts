import { AdminPenaltiesService } from './admin-penalty.service';

const ID = '020000000000000000000001';

// mức phạt đang có trong "database giả"
const oldPenalty = {
  _id: ID,
  violation: 'Vượt đèn đỏ',
  vehicleType: 'MOTORBIKE',
  fineMin: 4000000,
  fineMax: 6000000,
  additionalPenalty: null,
  legalRef: 'Nghị định 168/2024/NĐ-CP',
  status: 'active',
  version: 1,
};

// dữ liệu admin gửi lên
const dto = {
  violation: 'Vượt đèn đỏ (đã sửa)',
  vehicleType: 'MOTORBIKE',
  fineMin: 4000000,
  fineMax: 6000000,
  status: 'active',
};

// hàm giả của mongoose: .lean() trả về kết quả
const withLean = (value: any) => ({ lean: () => Promise.resolve(value) });

describe('AdminPenaltiesService.update', () => {
  let penaltyModel: any;
  let service: AdminPenaltiesService;

  beforeEach(() => {
    penaltyModel = {
      findById: jest.fn(() => withLean(oldPenalty)),
      findByIdAndUpdate: jest.fn((_id, update) =>
        withLean({ ...oldPenalty, ...update.$set }),
      ),
    };
    const stateModel: any = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ publishedVersion: 8 }),
    };
    const connection: any = { transaction: (work: any) => work('session-gia') };
    service = new AdminPenaltiesService(penaltyModel, stateModel, connection);
  });

  it('sửa hành vi: lấy phiên bản mới, tạo lại searchText', async () => {
    const result = await service.update(ID, dto);

    expect(result.version).toBe(8);
    expect(result.searchText).toBe('vuot den do (da sua)');
    // để trống hình phạt bổ sung thì lưu null
    expect(result.additionalPenalty).toBeNull();
  });

  it('mức thấp lớn hơn mức cao thì báo lỗi, không lưu', async () => {
    await expect(
      service.update(ID, { ...dto, fineMin: 7000000 }),
    ).rejects.toThrow();
    expect(penaltyModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
