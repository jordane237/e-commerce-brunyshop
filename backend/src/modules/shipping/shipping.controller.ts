import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';
import { DeliveryZoneDto } from './dto/delivery-zone.dto';
import { ShippingQuoteDto } from './dto/shipping-quote.dto';
import { ShippingQuoteRequestDto } from './dto/shipping-quote-request.dto';
import { ShippingQuoteService } from './shipping-quote.service';
import { ShippingService } from './shipping.service';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(
    private readonly shipping: ShippingService,
    private readonly quotes: ShippingQuoteService,
  ) {}

  /**
   * Endpoint public consommé par l'étape Livraison du tunnel (ORD-03).
   * Les frais et délais affichés viennent de la base, jamais d'une constante
   * frontend : `POST /orders` les recalcule de toute façon.
   */
  @Public()
  @Get('zones')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Lister les zones de livraison disponibles',
    description:
      'Zones seedées (TEC-07) avec frais en XAF entier et délai estimé. Lecture seule, utilisée par le tunnel de commande. Le devis détaillé sera fourni par SHP-01.',
  })
  @ApiOkResponse({ type: [DeliveryZoneDto], description: 'Zones triées par frais croissants' })
  @ApiResponse({ status: 429, description: 'RATE_LIMIT_EXCEEDED' })
  listZones(): Promise<DeliveryZoneDto[]> {
    return this.shipping.listZones();
  }

  /**
   * Devis de livraison public (SHP-02). Les frais, le délai et les modes
   * proviennent toujours des zones actives en base ; aucune donnée client n'est
   * retenue pour le calcul.
   */
  @Public()
  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Obtenir un devis de livraison',
    description:
      "Retourne les frais, le délai estimé et les modes disponibles pour une ville. Si la ville n'est pas desservie, retourne available=false avec une alternative WhatsApp.",
  })
  @ApiOkResponse({ type: ShippingQuoteDto, description: 'Devis de livraison' })
  @ApiResponse({ status: 429, description: 'RATE_LIMIT_EXCEEDED' })
  quote(@Body() dto: ShippingQuoteRequestDto): Promise<ShippingQuoteDto> {
    return this.quotes.quote(dto);
  }
}
