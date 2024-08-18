import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GlobalService } from '../../global.service';

@Component({
  selector: 'chat-input',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css'
})
export class ChatInputComponent implements AfterViewInit {
  @ViewChild('textarea') textareaElement!: ElementRef<HTMLTextAreaElement>;
  
  public promptText: string = "";
  public responseText: string = "";
  public mode: string = "chat"; //chat | query
  public workspaceId: string = "";
  public threadId: string = "";

  @Output() chatInputedEmitter = new EventEmitter<string>();
  @Output() chatStartEmitter = new EventEmitter<void>();
  @Output() chatEndEmitter = new EventEmitter<void>();
  @Output() chatAbortEmitter = new EventEmitter<object>();
  @Output() chunkEmitter = new EventEmitter<string>();

  constructor(private route: ActivatedRoute, private globalService: GlobalService) {}

  ngAfterViewInit() {
    this.adjustTextareaHeight();
    this.route.params.subscribe(params => {
      this.workspaceId = params['workspaceId'];
      this.threadId = params['threadId'];
    });
  }

  adjustTextareaHeight() {
    const textarea = this.textareaElement.nativeElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  onInput() {
    this.adjustTextareaHeight();
  }

  submit() {
    if(this.promptText.length == 0) return;

    this.chatInputedEmitter.emit(this.promptText);

    let prompt: string = this.promptText;
    this.promptText = "";

    fetch(`${this.globalService.apiDomain}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: prompt, 
        mode: this.mode,
        workspaceId: this.workspaceId,
        threadId: this.threadId
       }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.body;
    })
    .then(body => {
      if (body) {
        this.chatStartEmitter.emit();
        const reader = body.getReader();
        this.readStream(reader); // Start reading the stream
      }
    })
    .catch(error => {
      this.promptText = prompt;
      console.error('Fetch error:', error);
    });
  }

  private readStream(reader: ReadableStreamDefaultReader<Uint8Array>) {
    reader.read().then(({ done, value }) => {
      if (done) {
        console.log('Stream complete');
        this.chatEndEmitter.emit();
        return;
      }

      // Convert the Uint8Array to a string
      this.parseDataFromChunk(this.parseChunkedResponse(value));

      // Continue reading
      this.readStream(reader);
    });
  }

  private parseDataFromChunk(chunk: Array<string>) {
    for(let string of chunk) {
      this.chunkEmitter.emit(string);
    }
  }

  private parseChunkedResponse(value: Uint8Array) {
      let responses:Array<string> = [];
      let response = {continue:false,continueAt:-1,parsed:""};
      function decode(string: string, start = -1, end = -1) {
        try {
          if(start === -1) start = string.indexOf('\r\n');
          if(end === -1) end = string.indexOf("\n\n\r\n", start);

          if (start !== -1) {
            const chunkSize = parseInt(string.slice(0, start), 16);

            // If the chunk size is 0, we've reached the end of the response
            if (chunkSize === 0) return {continue: false, continueAt: -1, parsed: ""};
          }

          return {
            continue: string.indexOf('\r\n',end + "\n\n\r\n".length) != -1 && end != -1,
            continueAt: end,
            parsed: JSON.parse(string.slice(start + "\r\n".length + "data: ".length, end + 1)).textResponse || ""
          };
        } catch(error) {
          console.error("Error Parsing Chunk", error);
          return {continue: false, continueAt:- 1, parsed: ""};
        }
      }

      do {
        const decodedValue: string = new TextDecoder().decode(value);
        response = decode(decodedValue, response.continueAt);
        responses.push(response.parsed);
      } while(response.continue);
      
      return responses;
  }
}