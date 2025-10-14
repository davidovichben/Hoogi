import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-profile-welcome-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './profile-welcome-dialog.component.html',
  styleUrl: './profile-welcome-dialog.component.sass'
})
export class ProfileWelcomeDialogComponent {
  constructor(
    public lang: LanguageService,
    private dialogRef: MatDialogRef<ProfileWelcomeDialogComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }
}
