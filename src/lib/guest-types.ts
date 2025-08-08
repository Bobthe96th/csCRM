export interface GuestID {
  "Name"?: string
  "Gender"?: string
  "Date of arrival (check in)"?: string
  "Expected Arrival time"?: string
  "Date Calculator"?: string
  "Checkout date"?: string
  "Reservation Platform"?: string
  "Reason of visit"?: string
  "Property ID"?: string
  "Email"?: string
  "Country Code"?: string
  "Phone number"?: string
  "Country Code_1"?: string
  "Emergency contact number"?: string
  "Is any of the guests a smoker?"?: string
  "Identification Document"?: string
  "Nationality of main guest"?: string
  "Front of ID Card"?: string
  "Back of ID card"?: string
  "Passport Photo"?: string
  "Do you have an accompanied guest?"?: string
  "Identification Document_1"?: string
  "Nationality of accompanied guest"?: string
  "Front of ID Card_1"?: string
  "Back of ID card_1"?: string
  "Passport Photo_1"?: string
  "Mor"?: string
  "Identification Document_2"?: string
  "Nationality of 3rd guest"?: string
  "Front of ID Card_2"?: string
  "Back of ID card_2"?: string
  "Passport Photo_2"?: string
  "KYC"?: string
  "User IP address"?: string
  "User IP address_1"?: string
  "User ID"?: string
  "Comment"?: string
  "Comment User"?: string
  "Comment Date"?: string
  "Timestamp"?: string
  "Last Updated"?: string
  "Created By"?: string
  "Updated By"?: number
  "Entry Status"?: string
  "IP"?: string
  "ID"?: string
  "Key"?: string
}

export interface GuestVerificationRequest {
  phoneNumber?: string
  name?: string
  ginCode?: string
  email?: string
}

export interface GuestVerificationResult {
  success: boolean
  guest?: GuestID
  message: string
  verificationMethod: 'phone' | 'name' | 'gin' | 'email' | 'none'
  isVerified: boolean
}

export interface GuestContext {
  guestId: string
  name: string
  phoneNumber: string
  propertyId: string
  checkInDate: string
  checkOutDate: string
  email?: string
  nationality?: string
  reservationPlatform?: string
  reasonOfVisit?: string
  propertyInfo?: any
} 