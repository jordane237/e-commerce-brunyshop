"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
// Parameter decorator: @CurrentUser() gives the authenticated user.
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, context) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
});
