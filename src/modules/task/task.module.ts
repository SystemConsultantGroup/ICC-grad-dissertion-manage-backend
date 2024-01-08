import { Module, OnApplicationBootstrap } from "@nestjs/common";
import { TaskService } from "./task.service";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule implements OnApplicationBootstrap {
  constructor(private readonly taskService: TaskService) {}

  async onApplicationBootstrap() {
    await this.taskService.setCronJobs();
  }
}
