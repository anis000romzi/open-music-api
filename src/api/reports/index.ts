import Hapi from '@hapi/hapi';
import { ReportsHandler } from './handler';
import { routes } from './routes';
import { IReportsService } from '../../services/interfaces/IReportsService';
import { IReportsValidator } from '../../validator/reports';

interface ReportsPluginOptions {
  reportsService: IReportsService;
  reportsValidator: IReportsValidator;
}

export const reports: Hapi.Plugin<ReportsPluginOptions> = {
  name: 'reports',
  version: '1.0.0',
  register: async (server, { reportsService, reportsValidator }) => {
    const reportsHandler = new ReportsHandler(reportsService, reportsValidator);
    server.route(routes(reportsHandler));
  },
};
