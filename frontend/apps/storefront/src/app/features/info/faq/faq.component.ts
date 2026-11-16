import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { AccordionComponent, type AccordionItem, type TocSection } from '@bruny/ui';
import { APP_CONFIG } from '../../../core/app-config';
import { SeoService } from '../../../core/seo.service';
import { faqPageSchema } from '../../../core/structured-data';
import {
  LegalPageLayoutComponent,
  type BreadcrumbItem,
} from '../../shared/components/legal-page-layout/legal-page-layout.component';

interface FaqCategory {
  readonly id: string;
  readonly title: string;
  readonly items: readonly AccordionItem[];
}

const FAQ_CATEGORIES: readonly FaqCategory[] = [
  {
    id: 'faq-commandes',
    title: 'Commandes',
    items: [
      {
        id: 'passer-commande',
        question: 'Comment passer commande ?',
        answer:
          'Choisissez vos articles, ajoutez-les au panier, puis renseignez votre adresse et votre zone de livraison. Nous vous appelons pour confirmer avant de préparer votre commande.',
      },
      {
        id: 'suivre-commande',
        question: 'Comment suivre ma commande ?',
        answer:
          'Utilisez la référence reçue par SMS ou e-mail. Si vous avez un compte, retrouvez toutes vos commandes dans « Mon compte › Mes commandes ».',
      },
      {
        id: 'modifier-commande',
        question: 'Puis-je modifier ou annuler ma commande ?',
        answer:
          'Tant que la commande n’est pas expédiée, contactez-nous avec sa référence. Nous ferons le nécessaire si la préparation n’a pas commencé. Une fois expédiée, la commande ne peut plus être modifiée.',
      },
      {
        id: 'attente-confirmation',
        question: 'Pourquoi ma commande est-elle « en attente de confirmation » ?',
        answer:
          'Nous vérifions chaque commande payée à la livraison par appel ou WhatsApp avant expédition. Cela nous protège, vous comme nous, des commandes erronées.',
      },
      {
        id: 'sans-compte',
        question: 'Puis-je commander sans créer de compte ?',
        answer:
          'Oui. Vous recevrez votre référence par SMS ou e-mail. Créer un compte permet de retrouver vos commandes, vos adresses et vos favoris.',
      },
    ],
  },
  {
    id: 'faq-livraison',
    title: 'Livraison',
    items: [
      {
        id: 'ou-livrez-vous',
        question: 'Où livrez-vous ?',
        answer:
          'Nous livrons à Douala (Centre et Périphérie), à Yaoundé, à Bafoussam et dans plusieurs autres régions du Cameroun. La liste complète et les tarifs sont sur la page Livraison.',
      },
      {
        id: 'frais-livraison',
        question: 'Quels sont les frais de livraison ?',
        answer:
          '1 500 FCFA à Douala Centre, 2 500 FCFA à Douala Périphérie, 3 000 FCFA à Yaoundé, 4 000 FCFA à Bafoussam et 5 000 FCFA pour les autres régions. Le montant exact est confirmé au moment de la commande.',
      },
      {
        id: 'delais-livraison',
        question: 'Combien de temps prend la livraison ?',
        answer:
          'Comptez 1 jour ouvré à Douala Centre, 2 jours à Douala Périphérie, 3 jours à Yaoundé, 4 jours à Bafoussam et 5 jours pour les autres régions. Ces délais courent à partir de la confirmation de votre commande.',
      },
      {
        id: 'ville-absente',
        question: 'Ma ville n’est pas dans la liste. Que faire ?',
        answer:
          'Écrivez-nous à support@brunyshop.cm. Nous étudions les demandes de nouvelles zones et vous proposerons une solution si une livraison est possible.',
      },
      {
        id: 'paiement-livraison',
        question: 'Comment se passe le paiement à la livraison ?',
        answer:
          'Vous réglez en espèces ou par Mobile Money au moment de la réception, après avoir vérifié votre colis. Le coursier ne demande aucun paiement avant la remise.',
      },
    ],
  },
  {
    id: 'faq-tailles',
    title: 'Tailles et produits',
    items: [
      {
        id: 'choisir-pointure',
        question: 'Comment choisir ma pointure ?',
        answer:
          'Notre guide des tailles indique les correspondances EU. En cas d’hésitation entre deux pointures, prenez la plus grande. Un échange reste possible sous 7 jours.',
      },
      {
        id: 'stock-tailles',
        question: 'Les tailles affichées sont-elles disponibles ?',
        answer:
          'Oui. Le stock est mis à jour à chaque commande. Si une taille n’apparaît pas, elle n’est pas disponible pour ce modèle.',
      },
      {
        id: 'produits-neufs',
        question: 'Les produits sont-ils neufs ?',
        answer:
          'Tous nos articles sont neufs et proviennent de fournisseurs sélectionnés. Chaque paire est vérifiée avant expédition.',
      },
    ],
  },
  {
    id: 'faq-retours',
    title: 'Retours et échanges',
    items: [
      {
        id: 'echanger-taille',
        question: 'Puis-je échanger une taille ?',
        answer:
          'Oui, dans les 7 jours suivant la réception, si le produit n’a pas été porté à l’extérieur et si l’emballage est conservé. L’échange dépend des stocks disponibles.',
      },
      {
        id: 'demander-retour',
        question: 'Comment demander un retour ?',
        answer:
          'Écrivez-nous à support@brunyshop.cm avec votre référence de commande et le motif. Nous vérifions l’éligibilité, puis convenons ensemble de la remise du colis.',
      },
      {
        id: 'delai-remboursement',
        question: 'Quand suis-je remboursé ?',
        answer:
          'Après réception et contrôle du produit, le remboursement est traité sous 7 jours ouvrés selon le moyen de paiement utilisé. Les frais de livraison initiaux ne sont pas remboursés, sauf erreur de notre part.',
      },
    ],
  },
  {
    id: 'faq-compte',
    title: 'Compte et sécurité',
    items: [
      {
        id: 'mot-de-passe-oublie',
        question: 'J’ai oublié mon mot de passe. Que faire ?',
        answer:
          'Sur la page de connexion, choisissez « Mot de passe oublié », saisissez votre e-mail, puis utilisez le code à 6 chiffres reçu. Vous pourrez définir un nouveau mot de passe.',
      },
      {
        id: 'supprimer-compte',
        question: 'Comment supprimer mon compte ?',
        answer:
          'Dans « Mon compte › Profil », choisissez « Supprimer mon compte ». La suppression demande votre mot de passe, un code de vérification et la saisie de SUPPRIMER. Vos commandes passées sont conservées de façon anonymisée pour nos obligations comptables.',
      },
    ],
  },
];

@Component({
  selector: 'bruny-faq',
  standalone: true,
  imports: [LegalPageLayoutComponent, AccordionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
})
export class FaqComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly config = inject(APP_CONFIG);

  readonly categories = FAQ_CATEGORIES;

  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' },
    { label: 'FAQ' },
  ];

  readonly toc: readonly TocSection[] = this.categories.map((category) => ({
    id: category.id,
    title: category.title,
    level: 2,
  }));

  readonly intro =
    'Livraison, tailles, retours, commandes : les réponses aux questions que vous nous posez le plus souvent.';

  ngOnInit(): void {
    const description =
      'Réponses aux questions fréquentes BRUNY SHOPPING : commandes, livraison, tailles, retours, paiement et gestion du compte.';
    this.seo.setPageMeta({
      title: 'Questions fréquentes',
      description,
      canonicalPath: '/faq',
      jsonLd: faqPageSchema(
        this.config,
        description,
        this.categories.flatMap((category) => category.items),
      ),
    });
  }
}
