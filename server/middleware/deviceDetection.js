// import UAParser from "ua-parser-js";
import { UAParser } from "ua-parser-js";
import requestIp from "request-ip";

/**
 * Device Detection Middleware
 * Parses user-agent and IP address, attaches device info to req object
 */
const deviceDetection = (req, res, next) => {
  try {
    // Get IP address
    const clientIp = requestIp.getClientIp(req) || req.ip || req.connection.remoteAddress || "Unknown";
    
    // Get user-agent string
    const userAgent = req.headers["user-agent"] || "";
    
    // Parse user-agent
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    // Extract browser name
    const browser = result.browser.name || "Unknown";
    
    // Extract OS name
    const os = result.os.name || "Unknown";
    
    // Determine device type - normalize to "mobile" or "desktop"
    let deviceType = "desktop"; // Default to desktop
    const device = result.device;
    
    if (device.type === "mobile") {
      deviceType = "mobile";
    } else if (device.type === "tablet") {
      // Tablets are treated as mobile for restrictions
      deviceType = "mobile";
    } else {
      // Desktop/laptop - check OS to confirm
      if (os.toLowerCase().includes("windows") || 
          os.toLowerCase().includes("mac") || 
          os.toLowerCase().includes("linux")) {
        deviceType = "desktop";
      } else {
        // Default to desktop if OS detection fails
        deviceType = "desktop";
      }
    }
    
    // Attach device info to request object
    req.device = {
      ip: clientIp,
      browser: browser,
      os: os,
      deviceType: deviceType, // "mobile" or "desktop"
      userAgent: userAgent, // Store full user-agent for debugging
    };
    
    next();
  } catch (error) {
    console.error("[deviceDetection] Error:", error);
    // Fallback values if parsing fails
    req.device = {
      ip: req.ip || "Unknown",
      browser: "Unknown",
      os: "Unknown",
      deviceType: "Unknown",
      userAgent: req.headers["user-agent"] || "",
    };
    next();
  }
};

export default deviceDetection;
