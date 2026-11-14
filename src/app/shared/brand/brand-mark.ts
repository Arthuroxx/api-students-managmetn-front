import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sms-brand-mark',
  templateUrl: './brand-mark.html',
  styleUrl: './brand-mark.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandMark {
  readonly showName = input(true);
}
