import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LoadingOverlayComponent } from './shared/loading/loading-overlay.component';
import { LoadingInterceptor } from './shared/loading/loading.interceptor';

// ... tus imports de módulos (RouterModule, HttpClientModule, etc.)

@NgModule({
  declarations: [
    AppComponent,
    LoadingOverlayComponent,
    // ...otros componentes
  ],
  imports: [
    BrowserModule,
    // ...otros módulos (RouterModule, HttpClientModule, etc.)
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
