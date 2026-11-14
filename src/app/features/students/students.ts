import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sms-students',
  imports: [RouterLink],
  templateUrl: './students.html',
  styleUrl: './students.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Students {}
