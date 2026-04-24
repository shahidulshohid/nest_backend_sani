import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
@Injectable()
export class UtilsService {

private transporter:nodemailer.Transporter

constructor (private configService:ConfigService){


    const brevoEmail = this.configService.get<string>('BREVO_EMAIL');
    const brevoPass = this.configService.get<string>('BREVO_PASS');
    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user:brevoEmail,
        pass: brevoPass
      },
    });
    
}


async SendAuthEmail(
    to: string,
    subj:string,
    html:any
  ) {


    console.log("check email send data",to,subj)
    try {
      const formattedDate = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date());

     
      await this.transporter.sendMail({
        from: `"danieljatczak" <${process.env.EMAIL_FROM}`,
        to,
        subject:subj,
        html,
      });
    } catch (error) {
      throw new InternalServerErrorException('Email sending failed');
    }
  }


}
