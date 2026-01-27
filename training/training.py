import json
import os
import sys

import torch
from torch.utils.data import Dataset
from tqdm import tqdm, trange

sys.path.insert(1, "backend")
from signs_recognizer import (  # pyright: ignore[reportMissingImports]
    SignsRecognizer,
    signs,
)


class SignsDataset(Dataset):
    def __init__(self, path):
        self.size = len(os.listdir(path))
        self.path = path

    def __len__(self):
        return self.size

    def __getitem__(self, idx):
        data_path = os.path.join(self.path, f"{idx + 1}.json")
        input_data = []
        target_label = [0.0] * len(signs)
        with open(data_path, "r") as f:
            data = json.load(f)
            target_label[signs.index(data["sign"])] = 1.0
            input_data.append(data["WRIST_X"])
            input_data.append(data["WRIST_Y"])
            input_data.append(data["WRIST_Z"])
            input_data.append(data["THUMB_CMC_X"])
            input_data.append(data["THUMB_CMC_Y"])
            input_data.append(data["THUMB_CMC_Z"])
            input_data.append(data["THUMB_MCP_X"])
            input_data.append(data["THUMB_MCP_Y"])
            input_data.append(data["THUMB_MCP_Z"])
            input_data.append(data["THUMB_IP_X"])
            input_data.append(data["THUMB_IP_Y"])
            input_data.append(data["THUMB_IP_Z"])
            input_data.append(data["THUMB_TIP_X"])
            input_data.append(data["THUMB_TIP_Y"])
            input_data.append(data["THUMB_TIP_Z"])
            input_data.append(data["INDEX_FINGER_MCP_X"])
            input_data.append(data["INDEX_FINGER_MCP_Y"])
            input_data.append(data["INDEX_FINGER_MCP_Z"])
            input_data.append(data["INDEX_FINGER_PIP_X"])
            input_data.append(data["INDEX_FINGER_PIP_Y"])
            input_data.append(data["INDEX_FINGER_PIP_Z"])
            input_data.append(data["INDEX_FINGER_DIP_X"])
            input_data.append(data["INDEX_FINGER_DIP_Y"])
            input_data.append(data["INDEX_FINGER_DIP_Z"])
            input_data.append(data["INDEX_FINGER_TIP_X"])
            input_data.append(data["INDEX_FINGER_TIP_Y"])
            input_data.append(data["INDEX_FINGER_TIP_Z"])
            input_data.append(data["MIDDLE_FINGER_MCP_X"])
            input_data.append(data["MIDDLE_FINGER_MCP_Y"])
            input_data.append(data["MIDDLE_FINGER_MCP_Z"])
            input_data.append(data["MIDDLE_FINGER_PIP_X"])
            input_data.append(data["MIDDLE_FINGER_PIP_Y"])
            input_data.append(data["MIDDLE_FINGER_PIP_Z"])
            input_data.append(data["MIDDLE_FINGER_DIP_X"])
            input_data.append(data["MIDDLE_FINGER_DIP_Y"])
            input_data.append(data["MIDDLE_FINGER_DIP_Z"])
            input_data.append(data["MIDDLE_FINGER_TIP_X"])
            input_data.append(data["MIDDLE_FINGER_TIP_Y"])
            input_data.append(data["MIDDLE_FINGER_TIP_Z"])
            input_data.append(data["RING_FINGER_MCP_X"])
            input_data.append(data["RING_FINGER_MCP_Y"])
            input_data.append(data["RING_FINGER_MCP_Z"])
            input_data.append(data["RING_FINGER_PIP_X"])
            input_data.append(data["RING_FINGER_PIP_Y"])
            input_data.append(data["RING_FINGER_PIP_Z"])
            input_data.append(data["RING_FINGER_DIP_X"])
            input_data.append(data["RING_FINGER_DIP_Y"])
            input_data.append(data["RING_FINGER_DIP_Z"])
            input_data.append(data["RING_FINGER_TIP_X"])
            input_data.append(data["RING_FINGER_TIP_Y"])
            input_data.append(data["RING_FINGER_TIP_Z"])
            input_data.append(data["PINKY_MCP_X"])
            input_data.append(data["PINKY_MCP_Y"])
            input_data.append(data["PINKY_MCP_Z"])
            input_data.append(data["PINKY_PIP_X"])
            input_data.append(data["PINKY_PIP_Y"])
            input_data.append(data["PINKY_PIP_Z"])
            input_data.append(data["PINKY_DIP_X"])
            input_data.append(data["PINKY_DIP_Y"])
            input_data.append(data["PINKY_DIP_Z"])
            input_data.append(data["PINKY_TIP_X"])
            input_data.append(data["PINKY_TIP_Y"])
            input_data.append(data["PINKY_TIP_Z"])
        return torch.tensor(input_data), torch.tensor(target_label)


if __name__ == "__main__":
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = SignsRecognizer()
    model.to(device)
    print(device)

    my_set = SignsDataset("serialized_points")
    my_dataloader = torch.utils.data.DataLoader(
        dataset=my_set, batch_size=256, shuffle=True, num_workers=12, pin_memory=True
    )

    loss_fn = torch.nn.BCELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    loss_first = []
    loss_last = []
    # Training loop
    for epoch in trange(1000):
        loss_last.clear()
        for inputs, labels in tqdm(my_dataloader):
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = loss_fn(outputs, labels)
            if epoch == 0:
                loss_first.append(loss.item())
            loss_last.append(loss.item())
            loss.backward()
            optimizer.step()

    torch.save(model.state_dict(), "recognizer.pth")

    print(f"{loss_first=}")
    print(f"{loss_last=}")
