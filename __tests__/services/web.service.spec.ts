import { EmailService } from '@services/email.service';
import { ContactDTO } from '@dto/contactDTO';
import { WebService } from '@services/web.service';
import Container from 'typedi';
import { factory } from 'typeorm-seeding';

let contactDTO: ContactDTO;
let webService: WebService;

describe('WebService', () => {
  beforeAll( () => {
    webService = Container.get(WebService);
  });

  it('all dependencies should be defined', () => {
    expect(webService).toBeDefined();
  });

  describe('contactAdmin', ( ) => {
    beforeEach( async ( ) => {
      contactDTO = await factory(ContactDTO)().make();
    });
    it('should return true when email sent correctly', async ( ) => {
      jest.spyOn(EmailService, 'sendEmail').mockResolvedValueOnce(true);
      await expect(webService.contact(contactDTO))
        .resolves.toBeTruthy();
    });

    it('should return error when email not sent', async ( ) => {
      jest.spyOn(EmailService, 'sendEmail').mockRejectedValueOnce(
        new Error('Test error')
      );
      await expect(webService.contact(contactDTO))
        .rejects.toThrowError(Error);
    });
  });
});
