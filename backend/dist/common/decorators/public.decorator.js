"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Public = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
// Key marking a route as reachable without an access token.
exports.IS_PUBLIC_KEY = 'isPublic';
// Opt a route out of the global JwtAuthGuard (cachier §9: catalogue et
// endpoints authentification eux-mêmes).
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
