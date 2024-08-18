import { Component, ViewChild, ViewContainerRef, ComponentRef, ElementRef, OnInit } from '@angular/core';
import { ChatInputComponent } from './input/input.component';
import { ChatOutputComponent } from './output/output.component';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { GlobalService } from '../global.service';

@Component({
  selector: 'chat',
  standalone: true,
  imports: [
    ChatInputComponent,
    ChatOutputComponent,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})



export class ChatComponent implements OnInit {
  @ViewChild('chatstream', { read: ViewContainerRef, static: true }) chatContainer!: ViewContainerRef;

  display: string = "";
  prompt: string = "";
  currentChatOutputComponent: ComponentRef<ChatOutputComponent> | null = null;
  history: Array<object> = [];
  workspaceId: string = "";
  threadId: string = "";

  constructor(private route: ActivatedRoute, private globalService: GlobalService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.workspaceId = params['workspaceId'];
      this.threadId = params['threadId'];
    });
    this.getHistory();
  }
  private getHistory() {
    fetch(`${this.globalService.apiDomain}/chat-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workspaceId: this.workspaceId, threadId: this.threadId }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();  // Parse the response as JSON
    })
    .then(body => {
      console.log(body);
      this.history = body;
      this.generateHistory(this.history);
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
  }
  private generateHistory(history: Array<any>) {
    for(let chat of history) {
      this.currentChatOutputComponent = this.chatContainer.createComponent(ChatOutputComponent);
      this.currentChatOutputComponent.instance.display = chat.content;
      this.currentChatOutputComponent.instance.prompt = chat.content;
      this.currentChatOutputComponent.instance.userSpecific = chat.role;
    }
    this.scrollToBottom();
  }
  handleNewInput(response: string) {
    console.log("new chat", response)
    this.prompt = response;
    this.createNewChatOutput();
    this.scrollToBottom();
  }
  handleChatStart() {
    console.log("stream started")
  }
  handleChunk(response: string) {
    if(!this.currentChatOutputComponent) return this.abort();
    this.currentChatOutputComponent.instance.display += response || "";
    this.scrollToBottom();
  }
  private abort() {

  }
  private createNewChatOutput() {
    this.currentChatOutputComponent = this.chatContainer.createComponent(ChatOutputComponent);
    this.currentChatOutputComponent.instance.display = this.display;
    this.currentChatOutputComponent.instance.prompt = this.prompt;
  }
  scrollToBottom(forceScroll:boolean = true) {
    if (this.chatContainer) {
      setTimeout(() => {
        const nativeElement = this.chatContainer.element.nativeElement.parentElement;
        const threshold = 10;
        const isAtBottom = nativeElement.scrollTop + nativeElement.clientHeight >= nativeElement.scrollHeight - threshold;
        
        if (isAtBottom || forceScroll) {
          nativeElement.scrollTo({
            top: nativeElement.scrollHeight,
            behavior: 'smooth' 
          });
        }
      }, 0); // Ensure this runs after the view has updated
    }
  }
}
