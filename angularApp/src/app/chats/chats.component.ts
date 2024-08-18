import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { GlobalService } from '../global.service';

@Component({
  selector: 'chat-threads',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './chats.component.html',
  styleUrl: './chats.component.css'
})
export class ChatsComponent implements OnInit {
  workspaces: Array<any> = [];

  @ViewChild('threads', { static: false }) threadsRef!: ElementRef;

  constructor(private globalService: GlobalService, private router: Router) { }

  ngOnInit () {
    this.getWorkspaces();
  }
  private getWorkspaces() {
    fetch(`${this.globalService.apiDomain}/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();  // Parse the response as JSON
    })
    .then(body => {
      this.workspaces = body; // Update the state with the fetched data
      console.log(this.workspaces);
      
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
  }
  toggleThreads(workspace: any) {
    workspace.showThreads = !workspace.showThreads;

    if (workspace.showThreads) {
      setTimeout(() => {
        const threadsElement = this.threadsRef.nativeElement;
        threadsElement.style.maxHeight = `${threadsElement.scrollHeight + (workspace.threads.length + 1) * 15}px`;
      }, 0); // Wait for Angular to update the DOM
    } else {
      this.threadsRef.nativeElement.style.maxHeight = '0';
    }
  }

  createNewThread(event: MouseEvent, workspaceId:string) {
    fetch(`${this.globalService.apiDomain}/new-thread`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({workspaceId: workspaceId}),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();  // Parse the response as JSON
    })
    .then(body => {
      let thread = body.thread; // Update the state with the fetched data
      console.log(thread);
      this.workspaces[this.workspaces.map(workspace => workspace.slug).indexOf(workspaceId)].threads.push(thread);

      this.router.navigate(['/chat', workspaceId, thread.slug]);
      
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
    event.stopPropagation(); 
  }

  onThreadClick(event: MouseEvent) {
    event.stopPropagation(); 
  }

}
