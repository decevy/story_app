import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastOutlet } from '@shared/ui/toast-outlet/toast-outlet';

@Component({
  selector: 'sa-root',
  imports: [RouterOutlet, ToastOutlet],
  template: '<router-outlet /><sa-toast-outlet />',
})
export class App {}
