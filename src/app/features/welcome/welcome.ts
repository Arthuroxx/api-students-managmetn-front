import { ChangeDetectionStrategy, Component, VERSION } from '@angular/core';
import { BrandMark } from '../../shared/brand/brand-mark';

@Component({
  selector: 'sms-welcome',
  imports: [BrandMark],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Welcome {
  protected readonly angularVersion = VERSION.full;
}
