import { DataSource } from 'typeorm';
import { OperationHour } from './src/operation-hours/entities/operation-hour.entity';
import { Admin } from './src/admins/entities/admin.entity';

async function checkOperationHours() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Kajan2000#',
    database: 'pearson_db',
    entities: [OperationHour, Admin],
    synchronize: false,
  });

  try {
    await dataSource.initialize();

    const operationHourRepo = dataSource.getRepository(OperationHour);
    const allHours = await operationHourRepo.find();

    console.log('Total operation hours:', allHours.length);
    console.log('First record:', allHours[0]);

    if (allHours.length > 0) {
      allHours.forEach((hour, index) => {
        console.log(`Record ${index + 1}:`, {
          id: hour.id,
          day: hour.day,
          open_time: hour.open_time,
          close_time: hour.close_time,
          open_time_type: typeof hour.open_time,
          close_time_type: typeof hour.close_time,
        });
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

checkOperationHours();
