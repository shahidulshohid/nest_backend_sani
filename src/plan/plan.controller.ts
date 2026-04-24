import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/guards/auth/roles/roles.guard';
import { Roles } from 'src/guards/auth/roles/roles.decorator';
import { UserRole } from 'generated/prisma/enums';

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @UseGuards(JwtAuthGuard,RolesGuard)

  @Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN,UserRole.USER)

  @Post("create-plan")
  @HttpCode(HttpStatus.CREATED)
 async create(@Body() createPlanDto: CreatePlanDto) {
 const result= await this.planService.create(createPlanDto);
    return {
"success":true,
"message":"plan create success fully  !",
"data":result
      
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
 async findAll() {
    const result=await this.planService.findAll();

    return{
      "success":true,
      "message":"success fully get all palan!",
      "data":result
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
   async findOne(@Param('id') id: string) {
  const result=await this.planService.findOne(id);

  return {
       "success":true,
      "message":"success fully get single palan!",
      "data":result
}
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
  const result=await this.planService.update(id, updatePlanDto);

  return{
      "success":true,
      "message":"success fully update single palan!",
      "data":result
  }
  } 

  @Delete(':id')
 async remove(@Param('id') id: string) {

  console.log(id)
    const result = await this.planService.remove(id);

return{
      "success":true,
      "message":"success fully delete single palan!",
    
  }
    
  }
}