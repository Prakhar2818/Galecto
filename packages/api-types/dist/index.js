"use strict";
// ============================================
// SHARED API CONTRACT TYPES
// Used by both frontend and backend services
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventType = exports.ApiKeyAuditAction = exports.ReplayStatus = exports.NotificationType = exports.AlertSeverity = exports.AlertStatus = exports.ProjectEnvironment = exports.Role = void 0;
var Role;
(function (Role) {
    Role["OWNER"] = "OWNER";
    Role["ADMIN"] = "ADMIN";
    Role["DEVELOPER"] = "DEVELOPER";
    Role["OBSERVER"] = "OBSERVER";
})(Role || (exports.Role = Role = {}));
var ProjectEnvironment;
(function (ProjectEnvironment) {
    ProjectEnvironment["DEVELOPMENT"] = "DEVELOPMENT";
    ProjectEnvironment["STAGING"] = "STAGING";
    ProjectEnvironment["PRODUCTION"] = "PRODUCTION";
})(ProjectEnvironment || (exports.ProjectEnvironment = ProjectEnvironment = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "ACTIVE";
    AlertStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    AlertStatus["RESOLVED"] = "RESOLVED";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["CRITICAL"] = "CRITICAL";
    AlertSeverity["HIGH"] = "HIGH";
    AlertSeverity["MEDIUM"] = "MEDIUM";
    AlertSeverity["LOW"] = "LOW";
    AlertSeverity["INFO"] = "INFO";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["EMAIL"] = "EMAIL";
    NotificationType["SLACK"] = "SLACK";
    NotificationType["WEBHOOK"] = "WEBHOOK";
    NotificationType["PAGERDUTY"] = "PAGERDUTY";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var ReplayStatus;
(function (ReplayStatus) {
    ReplayStatus["PENDING"] = "PENDING";
    ReplayStatus["RUNNING"] = "RUNNING";
    ReplayStatus["COMPLETED"] = "COMPLETED";
    ReplayStatus["FAILED"] = "FAILED";
})(ReplayStatus || (exports.ReplayStatus = ReplayStatus = {}));
var ApiKeyAuditAction;
(function (ApiKeyAuditAction) {
    ApiKeyAuditAction["CREATED"] = "CREATED";
    ApiKeyAuditAction["ROTATED"] = "ROTATED";
    ApiKeyAuditAction["REVOKED"] = "REVOKED";
    ApiKeyAuditAction["USED"] = "USED";
})(ApiKeyAuditAction || (exports.ApiKeyAuditAction = ApiKeyAuditAction = {}));
// ============================================
// Event Types (Kafka)
// ============================================
var EventType;
(function (EventType) {
    EventType["LOG"] = "LOG";
    EventType["TRACE"] = "TRACE";
    EventType["METRIC"] = "METRIC";
    EventType["ALERT"] = "ALERT";
    EventType["REPLAY"] = "REPLAY";
})(EventType || (exports.EventType = EventType = {}));
