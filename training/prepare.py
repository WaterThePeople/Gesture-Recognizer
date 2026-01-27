import json
import os

import cv2
import mediapipe as mp
import numpy as np
from mediapipe import solutions
from mediapipe.framework.formats import landmark_pb2
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

MARGIN = 10
FONT_SIZE = 1
FONT_THICKNESS = 1
HANDEDNESS_TEXT_COLOR = (88, 205, 54)


def draw_landmarks_on_image(rgb_image, detection_result):
    hand_landmarks_list = detection_result.hand_landmarks
    handedness_list = detection_result.handedness
    annotated_image = np.copy(rgb_image)

    # Loop through the detected hands to visualize.
    for idx in range(len(hand_landmarks_list)):
        hand_landmarks = hand_landmarks_list[idx]
        handedness = handedness_list[idx]

        # Draw the hand landmarks.
        hand_landmarks_proto = landmark_pb2.NormalizedLandmarkList()  # pyright: ignore[reportAttributeAccessIssue]
        hand_landmarks_proto.landmark.extend(
            [
                landmark_pb2.NormalizedLandmark(  # pyright: ignore[reportAttributeAccessIssue]
                    x=landmark.x, y=landmark.y, z=landmark.z
                )
                for landmark in hand_landmarks
            ]
        )
        solutions.drawing_utils.draw_landmarks(  # pyright: ignore[reportAttributeAccessIssue]
            annotated_image,
            hand_landmarks_proto,
            solutions.hands.HAND_CONNECTIONS,  # pyright: ignore[reportAttributeAccessIssue]
            solutions.drawing_styles.get_default_hand_landmarks_style(),  # pyright: ignore[reportAttributeAccessIssue]
            solutions.drawing_styles.get_default_hand_connections_style(),  # pyright: ignore[reportAttributeAccessIssue]
        )

        # Get the top left corner of the detected hand's bounding box.
        height, width, _ = annotated_image.shape
        x_coordinates = [landmark.x for landmark in hand_landmarks]
        y_coordinates = [landmark.y for landmark in hand_landmarks]
        text_x = int(min(x_coordinates) * width)
        text_y = int(min(y_coordinates) * height) - MARGIN

        # Draw handedness (left or right hand) on the image.
        cv2.putText(
            annotated_image,
            f"{handedness[0].category_name}",
            (text_x, text_y),
            cv2.FONT_HERSHEY_DUPLEX,
            FONT_SIZE,
            HANDEDNESS_TEXT_COLOR,
            FONT_THICKNESS,
            cv2.LINE_AA,
        )

    return annotated_image


# STEP 2: Create an HandLandmarker object.
base_options = python.BaseOptions(model_asset_path="hand_landmarker.task")
options = vision.HandLandmarkerOptions(base_options=base_options, num_hands=1)
detector = vision.HandLandmarker.create_from_options(options)


# recursively get a list of all jpg images in D:\asl_alphabet_train
def get_images(path):
    images = []
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(".jpg"):
                images.append(os.path.join(root, file))
    return images


image_list = get_images(r"D:\asl_alphabet_train")
my_counter = 0
for image_path in image_list:
    # STEP 3: Load the input image.
    image = mp.Image.create_from_file(image_path)

    # STEP 4: Detect hand landmarks from the input image.
    detection_result = detector.detect(image)

    # STEP 5: Process the classification result. In this case, visualize it.
    annotated_image = draw_landmarks_on_image(image.numpy_view(), detection_result)

    if len(detection_result.hand_landmarks) > 0:
        # pprint(detection_result.hand_landmarks)
        # pprint(detection_result.handedness)
        res = {}
        res["sign"] = os.path.basename(os.path.dirname(image_path))
        res["hand"] = detection_result.handedness[0][0].category_name
        res["WRIST_X"] = detection_result.hand_landmarks[0][0].x
        res["WRIST_Y"] = detection_result.hand_landmarks[0][0].y
        res["WRIST_Z"] = detection_result.hand_landmarks[0][0].z
        res["THUMB_CMC_X"] = detection_result.hand_landmarks[0][1].x
        res["THUMB_CMC_Y"] = detection_result.hand_landmarks[0][1].y
        res["THUMB_CMC_Z"] = detection_result.hand_landmarks[0][1].z
        res["THUMB_MCP_X"] = detection_result.hand_landmarks[0][2].x
        res["THUMB_MCP_Y"] = detection_result.hand_landmarks[0][2].y
        res["THUMB_MCP_Z"] = detection_result.hand_landmarks[0][2].z
        res["THUMB_IP_X"] = detection_result.hand_landmarks[0][3].x
        res["THUMB_IP_Y"] = detection_result.hand_landmarks[0][3].y
        res["THUMB_IP_Z"] = detection_result.hand_landmarks[0][3].z
        res["THUMB_TIP_X"] = detection_result.hand_landmarks[0][4].x
        res["THUMB_TIP_Y"] = detection_result.hand_landmarks[0][4].y
        res["THUMB_TIP_Z"] = detection_result.hand_landmarks[0][4].z
        res["INDEX_FINGER_MCP_X"] = detection_result.hand_landmarks[0][5].x
        res["INDEX_FINGER_MCP_Y"] = detection_result.hand_landmarks[0][5].y
        res["INDEX_FINGER_MCP_Z"] = detection_result.hand_landmarks[0][5].z
        res["INDEX_FINGER_PIP_X"] = detection_result.hand_landmarks[0][6].x
        res["INDEX_FINGER_PIP_Y"] = detection_result.hand_landmarks[0][6].y
        res["INDEX_FINGER_PIP_Z"] = detection_result.hand_landmarks[0][6].z
        res["INDEX_FINGER_DIP_X"] = detection_result.hand_landmarks[0][7].x
        res["INDEX_FINGER_DIP_Y"] = detection_result.hand_landmarks[0][7].y
        res["INDEX_FINGER_DIP_Z"] = detection_result.hand_landmarks[0][7].z
        res["INDEX_FINGER_TIP_X"] = detection_result.hand_landmarks[0][8].x
        res["INDEX_FINGER_TIP_Y"] = detection_result.hand_landmarks[0][8].y
        res["INDEX_FINGER_TIP_Z"] = detection_result.hand_landmarks[0][8].z
        res["MIDDLE_FINGER_MCP_X"] = detection_result.hand_landmarks[0][9].x
        res["MIDDLE_FINGER_MCP_Y"] = detection_result.hand_landmarks[0][9].y
        res["MIDDLE_FINGER_MCP_Z"] = detection_result.hand_landmarks[0][9].z
        res["MIDDLE_FINGER_PIP_X"] = detection_result.hand_landmarks[0][10].x
        res["MIDDLE_FINGER_PIP_Y"] = detection_result.hand_landmarks[0][10].y
        res["MIDDLE_FINGER_PIP_Z"] = detection_result.hand_landmarks[0][10].z
        res["MIDDLE_FINGER_DIP_X"] = detection_result.hand_landmarks[0][11].x
        res["MIDDLE_FINGER_DIP_Y"] = detection_result.hand_landmarks[0][11].y
        res["MIDDLE_FINGER_DIP_Z"] = detection_result.hand_landmarks[0][11].z
        res["MIDDLE_FINGER_TIP_X"] = detection_result.hand_landmarks[0][12].x
        res["MIDDLE_FINGER_TIP_Y"] = detection_result.hand_landmarks[0][12].y
        res["MIDDLE_FINGER_TIP_Z"] = detection_result.hand_landmarks[0][12].z
        res["RING_FINGER_MCP_X"] = detection_result.hand_landmarks[0][13].x
        res["RING_FINGER_MCP_Y"] = detection_result.hand_landmarks[0][13].y
        res["RING_FINGER_MCP_Z"] = detection_result.hand_landmarks[0][13].z
        res["RING_FINGER_PIP_X"] = detection_result.hand_landmarks[0][14].x
        res["RING_FINGER_PIP_Y"] = detection_result.hand_landmarks[0][14].y
        res["RING_FINGER_PIP_Z"] = detection_result.hand_landmarks[0][14].z
        res["RING_FINGER_DIP_X"] = detection_result.hand_landmarks[0][15].x
        res["RING_FINGER_DIP_Y"] = detection_result.hand_landmarks[0][15].y
        res["RING_FINGER_DIP_Z"] = detection_result.hand_landmarks[0][15].z
        res["RING_FINGER_TIP_X"] = detection_result.hand_landmarks[0][16].x
        res["RING_FINGER_TIP_Y"] = detection_result.hand_landmarks[0][16].y
        res["RING_FINGER_TIP_Z"] = detection_result.hand_landmarks[0][16].z
        res["PINKY_MCP_X"] = detection_result.hand_landmarks[0][17].x
        res["PINKY_MCP_Y"] = detection_result.hand_landmarks[0][17].y
        res["PINKY_MCP_Z"] = detection_result.hand_landmarks[0][17].z
        res["PINKY_PIP_X"] = detection_result.hand_landmarks[0][18].x
        res["PINKY_PIP_Y"] = detection_result.hand_landmarks[0][18].y
        res["PINKY_PIP_Z"] = detection_result.hand_landmarks[0][18].z
        res["PINKY_DIP_X"] = detection_result.hand_landmarks[0][19].x
        res["PINKY_DIP_Y"] = detection_result.hand_landmarks[0][19].y
        res["PINKY_DIP_Z"] = detection_result.hand_landmarks[0][19].z
        res["PINKY_TIP_X"] = detection_result.hand_landmarks[0][20].x
        res["PINKY_TIP_Y"] = detection_result.hand_landmarks[0][20].y
        res["PINKY_TIP_Z"] = detection_result.hand_landmarks[0][20].z
        my_counter += 1
        with open(f"serialized_points/{my_counter}.json", "w") as file:
            json.dump(res, file)
        # pprint(res)

    # while True:
    #     cv2.imshow("Hand Landmarks", cv2.cvtColor(annotated_image, cv2.COLOR_RGB2BGR))
    #     if cv2.waitKey(1) & 0xFF == ord("q"):
    #         break
