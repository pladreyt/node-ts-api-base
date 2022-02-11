import { Service } from 'typedi';
import { ContactDTO } from '@dto/contactDTO';
import { IEmail } from 'src/interfaces/email/email.interface';
import { EmailService } from './email.service';

@Service()
export class WebService {
  async contact(contactDTO: ContactDTO): Promise<boolean> {
    const emailData: IEmail = {
      from: process.env.EMAIL_SENDER,
      to: process.env.SUPPORT_MAIL,
      replyTo: contactDTO.email,
      subject: contactDTO.subject,
      text: `${contactDTO.lastName}, ${contactDTO.firstName} wrote:
        ${contactDTO.body}
      `
    };
    return EmailService.sendEmail( emailData );
  }
}
