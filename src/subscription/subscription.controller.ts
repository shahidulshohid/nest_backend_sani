import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/guards/auth/roles/roles.guard';
import { Roles } from 'src/guards/auth/roles/roles.decorator';
import { UserRole } from 'generated/prisma/enums';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}
 
  @UseGuards(JwtAuthGuard)
  @Post("create-subscription")
 async create(@Req() req:Request&{user:any}, @Body() createSubscriptionDto:{planId:string}) {

    const {userId}=req.user
    const result=await this.subscriptionService.create(userId,createSubscriptionDto.planId);
    return {
      "success":true,
      "message":"subscription create success fully !"
      ,
      "data":result
    }

  }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN)
  @Get()
  @HttpCode(HttpStatus.OK)

 async findAll() {
  const result=await this.subscriptionService.findAll();
  return {
    "success":true,
    "message":"success fully get all subscription !",
    "data":result
  }
  }


  @Get(':id') 
   @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const result=await this.subscriptionService.findOne(id);

    return {
    "success":true,
    "message":"success fully get single subscription !",
    "data":result
  }
  }

  @UseGuards(JwtAuthGuard)
  @Get("my/subscriptions")
  async getMySubscription (@Req() req:Request&{user:any}){
  
    const {userId}=req?.user
    console.log("user id check",userId)

    const result=await this.subscriptionService.getMySubscription(userId)

    return {
    "success":true,
    "message":"successfully get my subscriptions !",
    "data":result
  }
    
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionService.update(+id, updateSubscriptionDto);
  }
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
 const result=await this.subscriptionService.remove(id);
     return {
    "success":true,
    "message":"successfully deleted  subscription !",
   
  }
  }
}