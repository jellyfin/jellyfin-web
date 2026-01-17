#!/bin/bash
# Jellyfin Web Security Mitigation Script
# Run this in a CI environment after testing

echo "🔒 Starting Jellyfin Web Security Mitigation..."

# Phase 1: Safe automatic fixes
echo "📦 Phase 1: Safe automatic fixes..."
npm audit fix

# Phase 2: Critical security updates with testing
echo "🚨 Phase 2: Critical security updates..."

# Update React Router (XSS vulnerability)
npm install react-router-dom@6.30.3

# Update DOMPurify (XSS vulnerability)
npm install dompurify@3.3.1

# Update PDF.js (Code execution vulnerability)
npm install pdfjs-dist@5.4.530

echo "✅ Security updates applied"
echo "🧪 Run comprehensive tests before deployment"
