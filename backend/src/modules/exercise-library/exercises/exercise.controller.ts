import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ExerciseService } from './exercise.service';

@Controller('exercise-library/exercises')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExerciseController {
  constructor(private exerciseService: ExerciseService) {}

  @Post()
  @Roles('OWNER', 'THERAPIST')
  async createExercise(@Body() data: any, @Request() req) {
    return this.exerciseService.createExercise({
      ...data,
      createdById: req.user.id,
    });
  }

  @Get()
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getExercises(
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Query('bodyPart') bodyPart?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.exerciseService.getExercises({
      category,
      difficulty,
      bodyPart,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('categories')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async getExerciseCategories() {
    return this.exerciseService.getExerciseCategories();
  }

  @Get('popular')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async getPopularExercises(@Query('limit') limit?: string) {
    return this.exerciseService.getPopularExercises(
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('search')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async searchExercises(@Query('q') query: string) {
    return this.exerciseService.searchExercises(query);
  }

  @Get(':exerciseId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getExercise(@Param('exerciseId') exerciseId: string) {
    return this.exerciseService.getExercise(exerciseId);
  }

  @Put(':exerciseId')
  @Roles('OWNER', 'THERAPIST')
  async updateExercise(
    @Param('exerciseId') exerciseId: string,
    @Body() data: any,
  ) {
    return this.exerciseService.updateExercise(exerciseId, data);
  }

  @Delete(':exerciseId')
  @Roles('OWNER', 'THERAPIST')
  async deleteExercise(@Param('exerciseId') exerciseId: string) {
    return this.exerciseService.deleteExercise(exerciseId);
  }
}
