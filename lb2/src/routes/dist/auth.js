"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var express_1 = require("express");
var passport_1 = require("passport");
var User_js_1 = require("../models/User.js");
var bcryptjs_1 = require("bcryptjs");
var router = express_1.Router();
var userManager = new User_js_1.UserManager();
// Страница входа
router.get('/login', function (req, res) {
    res.render('auth/login', {
        title: 'Вход - Библиотека',
        currentPath: req.path,
        messages: req.flash()
    });
});
// Обработчик входа
router.post('/login', function (req, res, next) {
    passport_1["default"].authenticate('local', function (err, user, info) {
        if (err)
            return next(err);
        if (!user) {
            req.flash('error', info.message);
            return res.redirect('/auth/login');
        }
        req.logIn(user, function (err) {
            if (err)
                return next(err);
            req.flash('success', 'Вы успешно вошли в систему!');
            return res.redirect('/');
        });
    })(req, res, next);
});
// Обработчик выхода
router.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err)
            return next(err);
        req.flash('success', 'Вы успешно вышли из системы!');
        res.redirect('/');
    });
});
// Страница регистрации
router.get('/register', function (req, res) {
    res.render('auth/register', {
        title: 'Регистрация - Библиотека',
        currentPath: req.path,
        messages: req.flash()
    });
});
// Обработчик регистрации
router.post('/register', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, email, existingUser, hashedPassword, user, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.body, username = _a.username, password = _a.password, email = _a.email;
                // Базовая валидация
                if (!username || !password || !email) {
                    req.flash('error', 'Все поля обязательны для заполнения');
                    return [2 /*return*/, res.redirect('/auth/register')];
                }
                if (password.length < 6) {
                    req.flash('error', 'Пароль должен содержать не менее 6 символов');
                    return [2 /*return*/, res.redirect('/auth/register')];
                }
                return [4 /*yield*/, userManager.findUserByUsername(username)];
            case 1:
                existingUser = _b.sent();
                if (existingUser) {
                    req.flash('error', 'Пользователь с таким именем уже существует');
                    return [2 /*return*/, res.redirect('/auth/register')];
                }
                return [4 /*yield*/, bcryptjs_1["default"].hash(password, 12)];
            case 2:
                hashedPassword = _b.sent();
                return [4 /*yield*/, userManager.createUser(username, hashedPassword, email)];
            case 3:
                user = _b.sent();
                req.flash('success', 'Регистрация прошла успешно! Пожалуйста, войдите.');
                res.redirect('/auth/login');
                return [3 /*break*/, 5];
            case 4:
                error_1 = _b.sent();
                next(error_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports["default"] = router;
