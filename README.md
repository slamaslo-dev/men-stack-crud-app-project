# Sociometric Test Results Calculator

<img src="logo.png" alt="SOTEREC Logo"/>

## Description

The Sociometric Test Results Calculator is a web application designed for therapists and group facilitators to conduct and analyze sociometric tests with groups. This tool helps professionals understand group dynamics by measuring how participants perceive each other and how they believe others perceive them.

### Key Features:

- **User Authentication**: Secure login and registration system for therapists
- **Assessment Creation**: Create assessments for groups of 3-15 participants
- **Perception Matrix**: Record how each participant perceives others in the group
- **Emission Matrix**: Record how each participant believes others perceive them
- **Automatic Calculations**: Automatically calculates important metrics including:
  - Mutualities (reciprocated positive perceptions)
  - Incongruities (mismatches between perceived and actual perceptions)
  - Perception and Emission Indices
  - Individual and Group Telic Indices
- **Individual Analysis**: View detailed results for each participant
- **Group Analysis**: Visualize and analyze overall group dynamics

## Background

Sociometric testing is a technique used in psychology and group therapy to measure interpersonal relationships within a group. This application streamlines the process of collecting, calculating, and visualizing sociometric data, making it easier for therapists to gain insights into group dynamics and help improve group cohesion and communication.

## Getting Started

- **Live Demo**: [Open](https://lamaslo.com/sociometrics)
- **Planning Materials**: [Trello Board](https://trello.com/b/UYYlVru6/men-stack-crud-app-project)

## Technologies Used

- **Backend**:
  - Node.js
  - Express.js
  - MongoDB with Mongoose
  - Express-Session for authentication
  - Bcrypt for password hashing
  
- **Frontend**:
  - EJS (Embedded JavaScript) templating
  - CSS for styling
  
## Usage Guide

1. **Create an Account**: Sign up with a username, password, and first name
2. **Create a New Assessment**: Provide a title and specify the number of participants
3. **Add Participants**: Enter the names of all participants
4. **Fill out the Perception Matrix**: For each participant, indicate how they perceive every other participant
5. **Fill out the Emission Matrix**: For each participant, indicate how they think others perceive them
6. **View Results**: Access individual and group analysis data

## Next Steps

- **Edit Matrices**: Add functionality to edit perception and emission matrices after creation
- **PDF Export**: Allow exporting results as PDF reports
- **Data Visualization**: Enhance visualization with interactive charts and graphs
- **Mobile Optimization**: Improve mobile experience for on-the-go assessments
- **Group Comparison**: Add features to compare results across different groups or sessions
- **Code Refactoring**: Simplify and optimize code structure and calculations

## License

Creative Commons Attribution-NonCommercial
