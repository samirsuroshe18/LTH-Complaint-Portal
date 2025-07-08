"use client"

import { useState } from "react"
import { ArrowLeft, Camera, Upload, CheckCircle } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { useComplaints } from "../contexts/ComplaintContext"
import axios from "axios"

export default function ComplaintForm({ category, onBack, onSuccess }) {
  const [description, setDescription] = useState("")
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const { addComplaint, refreshComplaints } = useComplaints()

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim()) return
  
    setIsSubmitting(true)
  
    try {
      const formData = new FormData()
      formData.append("category", category)
      formData.append("description", description.trim())
      formData.append("location", "sixteen")
  
      if (photoPreview instanceof File) {
        formData.append("file", photoPreview)
      }
  
      const response = await axios.post("http://localhost:9000/api/v1/complaint/submit", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
  
      if (response.status === 201) {
        setShowSuccess(true)
        if (refreshComplaints) refreshComplaints();
      } else {
        alert("Complaint submission failed")
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred while submitting the complaint")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (showSuccess) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <Card className="text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Complaint Submitted Successfully!</h2>
            <p className="text-muted-foreground">
              Our team will resolve it shortly. You can track the progress in the History section.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{category} Complaint</h1>
          <p className="text-muted-foreground text-sm">Please provide details about your issue</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complaint Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Photo (Optional)</Label>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Label htmlFor="camera" className="flex-1 cursor-pointer">
                    <div className="photo-upload-area">
                      <Camera className="w-4 h-4" />
                      <span className="text-sm">Take Photo</span>
                    </div>
                  </Label>
                  <Label htmlFor="upload" className="flex-1 cursor-pointer">
                    <div className="photo-upload-area">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Upload Photo</span>
                    </div>
                  </Label>
                </div>

                <input
                  id="camera"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <input id="upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />

                {photoPreview && (
                  <div className="relative">
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Complaint photo preview"
                      className="w-full max-w-sm mx-auto rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setPhoto(null)
                        setPhotoPreview(null)
                      }}
                      className="absolute top-2 right-2"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !description.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Complaint"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
