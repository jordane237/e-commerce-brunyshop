import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { SeoService } from '../../core/seo.service';
import { CategoriesPillsComponent } from './sections/categories-pills/categories-pills.component';
import { FacebookCtaComponent } from './sections/facebook-cta/facebook-cta.component';
import { HeroBannerComponent } from './sections/hero-banner/hero-banner.component';
import { ProductSectionComponent } from './sections/product-section/product-section.component';
import { ReassuranceBandComponent } from './sections/reassurance-band/reassurance-band.component';
import { HomeDataService } from './services/home-data.service';
import type { CatalogProduct } from '@bruny/data-access';
import { CartStore } from '../../core/cart/cart.store';

@Component({
  selector: 'bruny-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroBannerComponent,
    CategoriesPillsComponent,
    ProductSectionComponent,
    ReassuranceBandComponent,
    FacebookCtaComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  readonly data = inject(HomeDataService);
  private readonly cart = inject(CartStore);
  private readonly seo = inject(SeoService);

  /** Erreur globale : les quatre sections ont échoué (CA #4). */
  readonly allFailed = computed(
    () =>
      this.data.categoriesError() !== null &&
      this.data.newProductsError() !== null &&
      this.data.bestSellersError() !== null &&
      this.data.promotionsError() !== null,
  );

  ngOnInit(): void {
    this.seo.set(
      'Chaussures à Douala et Yaoundé',
      'Chaussures sélectionnées au Cameroun : nouveautés, meilleures ventes et promotions. Prix en FCFA, paiement à la livraison.',
      '/',
    );
    this.data.reloadAll();
  }

  onAdd(product: CatalogProduct): void {
    this.cart.addProduct(product);
  }
}
