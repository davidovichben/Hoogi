import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { TemplatesListComponent } from './templates-list/templates-list.component';

type AutomationTab = 'create' | 'templates' | 'notifications';

@Component({
  selector: 'app-automations',
  standalone: true,
  imports: [CommonModule, RouterModule, TemplatesListComponent],
  templateUrl: './automations.component.html',
  styleUrls: ['./automations.component.sass']
})
export class AutomationsComponent implements OnInit {
  activeTab: AutomationTab = 'create';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    // Check for tab query parameter
    this.route.queryParams.subscribe(params => {
      const tabParam = params['tab'] as AutomationTab;
      if (tabParam && ['create', 'templates', 'notifications'].includes(tabParam)) {
        this.activeTab = tabParam;
      }
    });
  }

  setActiveTab(tab: AutomationTab) {
    this.activeTab = tab;
    // Update URL with tab query parameter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  navigateToTemplates() {
    this.router.navigate(['/templates']);
  }
}
