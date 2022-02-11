import {
  JsonController,
  Body,
  Post
} from 'routing-controllers';
import { Service } from 'typedi';
import { WebService } from '@services/web.service';
import { ContactDTO } from '@dto/contactDTO';

@JsonController('/web')
@Service()
export class WebController {
  constructor(private readonly webService: WebService) { }

  @Post('/contact')
  async contactAdmin(
    @Body() contactDTO: ContactDTO
  ): Promise<boolean> {
    return this.webService.contact(
      contactDTO
    );
  }
}
