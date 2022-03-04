import { Container } from 'typedi';
import { TargetCron } from './targets.cron';

const targetCron = Container.get(TargetCron);

targetCron.start();
