import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'chat-output',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './output.component.html',
  styleUrls: ['./output.component.css', '../chat.component.css']
})
export class ChatOutputComponent {
  @Input() display: string = '';
  @Input() prompt: string = '';
  @Input() userSpecific: string = "";

  messengerAppearance: boolean = false;
  hideProfiles: boolean = false;
}
