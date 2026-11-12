import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CartValidationService } from './cart-validation.service';
import { CartValidationResponseDto } from './dto/cart-validation-response.dto';
import { ValidateCartDto } from './dto/validate-cart.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartValidation: CartValidationService) {}

  // Guest carts must be validated without a token, hence @Public() on top of
  // the global JwtAuthGuard; OptionalJwtAuthGuard only attaches the user when
  // the token is valid (audit + future persisted-cart ownership).
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Valider le panier : recalcul des prix, promotions, stock et écarts',
    description:
      "⚠️ Aucun prix fourni par le client n'est utilisé. Tous les prix sont recalculés côté serveur depuis la base (prix de la variante, promotion produit active, sinon prix de base). Le body ne transporte que variantId et quantity ; tout champ de prix non déclaré est rejeté en 400 VALIDATION_ERROR.",
  })
  @ApiBody({ type: ValidateCartDto })
  @ApiOkResponse({
    type: CartValidationResponseDto,
    description: 'Panier validé avec la liste des écarts (aucun prix client accepté)',
  })
  @ApiBadRequestResponse({
    description: 'Body invalide (champ non autorisé, quantité hors bornes, doublon de prix…)',
  })
  @ApiResponse({ status: 429, description: 'Trop de requêtes (30/min/IP)' })
  validate(
    @Body() dto: ValidateCartDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<CartValidationResponseDto> {
    return this.cartValidation.validateCart(dto, user?.id);
  }
}
