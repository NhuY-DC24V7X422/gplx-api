import { AdminSignsService } from './admin-sign.service';

const ID = '010000000000000000000001';

// biển báo đang có trong "database giả"
const oldSign = {
  _id: ID,
  code: 'P.102',
  name: 'Cấm đi ngược chiều',
  group: 'PROHIBITION',
  description: '',
  status: 'active',
  version: 1,
};

// hàm giả của mongoose: .lean() trả về kết quả
const withLean = (value: any) => ({ lean: () => Promise.resolve(value) });

describe('AdminSignsService.update', () => {
  let signModel: any;
  let service: AdminSignsService;

  beforeEach(() => {
    signModel = {
      findById: jest.fn(() => withLean(oldSign)),
      findByIdAndUpdate: jest.fn((_id, update) =>
        withLean({ ...oldSign, ...update.$set }),
      ),
    };
    const stateModel: any = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ publishedVersion: 7 }),
    };
    const connection: any = { transaction: (work: any) => work('session-gia') };
    service = new AdminSignsService(signModel, stateModel, connection);
  });

  it('sửa tên: lấy phiên bản mới, searchText có cả mã biển', async () => {
    const result = await service.update(ID, {
      name: 'Cấm đi ngược chiều (đã sửa)',
      group: 'PROHIBITION',
      status: 'active',
    });

    expect(result.version).toBe(7);
    expect(result.name).toBe('Cấm đi ngược chiều (đã sửa)');
    expect(result.searchText).toBe('p.102 cam di nguoc chieu (da sua)');
  });

  it('id sai định dạng thì báo không tìm thấy', async () => {
    await expect(
      service.update('abc', { name: 'x', group: 'OTHER', status: 'active' }),
    ).rejects.toThrow();
    expect(signModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
