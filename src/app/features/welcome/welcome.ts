import { ChangeDetectionStrategy, Component, VERSION } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sms-welcome',
  imports: [RouterLink],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Welcome {
  protected readonly angularVersion = VERSION.full;
}
