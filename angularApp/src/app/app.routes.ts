import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { ChatsComponent } from './chats/chats.component';

export const routes: Routes = [
  //{ path: '', redirectTo: '/chats', pathMatch: 'full' },
  //{ path: 'chats', component: ChatsComponent },
  { path: 'chat/:workspaceId/:threadId', component: ChatComponent },
  // Add more routes as needed
];