"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordDto = exports.ForgotPasswordDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
// Always answers 202 whatever the account status (cachier §10.2: identical
// response whether the account exists or not).
class ForgotPasswordDto {
    email;
}
exports.ForgotPasswordDto = ForgotPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'client@exemple.cm' }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(254),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
class ResetPasswordDto {
    email;
    code;
    newPassword;
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'client@exemple.cm' }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(254),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '6-digit code received by email' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9]{6}$/, { message: 'code must be 6 digits' }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minLength: 10, description: 'Minimum 10 chars, server-checked' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
