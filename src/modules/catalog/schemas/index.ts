import { CatalogState, CatalogStateSchema } from './catalog-state.schema';
import { Category, CategorySchema } from './category.schema';
import { LicenseClass, LicenseClassSchema } from './license-class.schema';
import { Penalty, PenaltySchema } from './penalty.schema';
import { Question, QuestionSchema } from './question.schema';
import { TrafficSign, TrafficSignSchema } from './traffic-sign.schema';

export { CatalogState, Category, LicenseClass, Penalty, Question, TrafficSign };

// Danh sách model, đăng ký 1 lần trong CatalogModule
export const CATALOG_MODELS = [
  { name: Category.name, schema: CategorySchema },
  { name: LicenseClass.name, schema: LicenseClassSchema },
  { name: Question.name, schema: QuestionSchema },
  { name: TrafficSign.name, schema: TrafficSignSchema },
  { name: Penalty.name, schema: PenaltySchema },
  { name: CatalogState.name, schema: CatalogStateSchema },
];
