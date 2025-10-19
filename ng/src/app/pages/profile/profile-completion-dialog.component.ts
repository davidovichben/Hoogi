import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-profile-completion-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './profile-completion-dialog.component.html',
  styleUrl: './profile-completion-dialog.component.sass'
})
export class ProfileCompletionDialogComponent {
  constructor(
    public lang: LanguageService,
    private dialogRef: MatDialogRef<ProfileCompletionDialogComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }
}
